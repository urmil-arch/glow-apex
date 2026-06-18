import logging
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.admin.providers.repository import ProviderRepository
from app.admin.service_packages.repository import ServicePackageRepository
from app.admin.tasks.repository import TaskRepository
from app.notifications.repository import NotificationRepository
from app.orders.provider_api import call_provider
from app.orders.repository import OrderRepository

logger = logging.getLogger(__name__)


async def place_smm_order(
    db: AsyncIOMotorDatabase,
    order: dict,
    order_id: str,
    payment_label: str,
) -> bool:
    """
    Place an SMM order with the resolved provider for an already-paid order.

    Resolves the service package's default provider and fallbacks in priority order,
    attempts each active provider candidate until one accepts, and updates the order
    document with the provider order id and status. If every candidate fails, marks
    the order 'provider_error' and opens a high-priority failed_order task for manual
    fulfilment.

    Idempotency (claiming the payment so only one caller places the order) is the
    caller's responsibility — this function assumes the claim has already been won.

    Returns True if a provider accepted the order, False otherwise.
    """
    repo = OrderRepository(db)

    service_package_id = order.get("service_package_id", "")
    if not service_package_id:
        logger.error(
            "[%s] [ORDER %s] No service_package_id on order — cannot place SMM order",
            payment_label, order_id,
        )
        await repo.update(order_id, {"status": "failed"})
        return False

    candidates = await _resolve_candidates_from_package(db, service_package_id, order_id, payment_label)

    logger.info("[%s] [ORDER %s] %d provider candidate(s) in priority order", payment_label, order_id, len(candidates))

    for attempt, candidate in enumerate(candidates, start=1):
        label = "DEFAULT" if attempt == 1 else f"FALLBACK #{attempt - 1}"
        provider = await ProviderRepository(db).find_by_id(candidate.get("provider_id", ""))
        if not provider:
            logger.warning("[%s] [ORDER %s] [%s] No provider for service '%s', skipping", payment_label, order_id, label, candidate.get("name"))
            continue

        try:
            result = await call_provider(
                provider["url"],
                provider["api_key"],
                {
                    "action": "add",
                    "service": candidate["provider_service_id"],
                    "link": order["link"],
                    "quantity": order["quantity"],
                },
            )
        except Exception as exc:
            logger.warning("[%s] [ORDER %s] [%s] Provider '%s' raised exception: %s", payment_label, order_id, label, provider.get("name"), exc)
            continue

        if "error" not in result:
            provider_order_id = str(result.get("order", ""))
            smm_status = result.get("status", "Pending")
            await repo.update(order_id, {
                "provider_id": str(provider["_id"]),
                "provider_order_id": provider_order_id,
                "status": smm_status,
            })
            logger.info(
                "[%s] [ORDER %s] [%s] SUCCESS — provider '%s' accepted. provider_order_id=%s status=%s",
                payment_label, order_id, label, provider.get("name"), provider_order_id, smm_status,
            )
            return True

        logger.warning(
            "[%s] [ORDER %s] [%s] Provider '%s' rejected: %s — %s",
            payment_label, order_id, label, provider.get("name"), result.get("error"),
            "trying next fallback..." if attempt < len(candidates) else "no more candidates",
        )

    logger.error("[%s] [ORDER %s] All %d provider(s) failed — payment received but SMM order needs manual review", payment_label, order_id, len(candidates))
    await repo.update(order_id, {"status": "provider_error"})
    await _open_failed_order_task(db, order, order_id, payment_label, len(candidates))
    return False


async def _resolve_candidates_from_package(
    db: AsyncIOMotorDatabase,
    service_package_id: str,
    order_id: str,
    payment_label: str,
) -> list[dict]:
    """
    Build an ordered candidate list from a service_packages document.
    The default provider service comes first; active fallbacks follow in stored priority order.
    Each candidate dict carries provider_id and provider_service_id for call_provider.
    """
    pkg = await ServicePackageRepository(db).find_by_id(service_package_id)
    if not pkg:
        logger.error(
            "[%s] [ORDER %s] ServicePackage %s not found — cannot resolve candidates",
            payment_label, order_id, service_package_id,
        )
        return []

    candidates: list[dict] = [
        {
            "provider_id": pkg["provider_id"],
            "provider_service_id": pkg["provider_service_id"],
            "name": pkg.get("provider_service_name", ""),
        }
    ]
    for fb in pkg.get("fallbacks", []):
        if fb.get("is_active", True):
            candidates.append({
                "provider_id": fb["provider_id"],
                "provider_service_id": fb["provider_service_id"],
                "name": fb.get("provider_service_name", ""),
            })

    logger.info(
        "[%s] [ORDER %s] ServicePackage routing — default: %s/%s, fallbacks: %d active",
        payment_label, order_id,
        pkg["provider_name"], pkg["provider_service_id"],
        len(candidates) - 1,
    )
    return candidates



async def _open_failed_order_task(
    db: AsyncIOMotorDatabase,
    order: dict,
    order_id: str,
    payment_label: str,
    candidate_count: int,
) -> None:
    """Open a high-priority failed_order task for manual fulfilment, if one does not already exist."""
    task_repo = TaskRepository(db)
    if await task_repo.exists_for_order(order_id, "failed_order"):
        return

    user_info = (order.get("user_info") or [{}])[0]
    user_id = order.get("user_id", "")
    service_label = order.get("category_name") or order.get("service_name", "Unknown")
    quantity = order.get("quantity", 0)
    now = datetime.now(timezone.utc)

    await task_repo.insert({
        "type": "failed_order",
        "status": "open",
        "priority": "high",
        "title": f"Provider unavailable — {service_label} × {quantity:,}",
        "description": (
            f"Order #{order_id[-8:]} was paid (${order.get('charge', 0):.4f}) via {payment_label} "
            f"but all {candidate_count} provider(s) rejected the order. Manual fulfilment or refund is required."
        ),
        "notes": "",
        "order_id": order_id,
        "user_id": user_id,
        "user_email": user_info.get("email", ""),
        "user_username": user_info.get("username", ""),
        "order_link": order.get("link", ""),
        "service_name": order.get("service_name", ""),
        "category_name": order.get("category_name", ""),
        "quantity": quantity,
        "charge": order.get("charge"),
        "currency": order.get("currency", "USD"),
        "seen_by_admin": False,
        "resolved_at": None,
        "created_at": now,
        "updated_at": now,
    })

    if user_id:
        await NotificationRepository(db).insert({
            "title": "Order Processing — Please Allow Some Time",
            "message": (
                f"Your order for {service_label} × {quantity:,} is being processed and may take a little longer than usual. "
                "There is nothing you need to do — we will take care of it."
            ),
            "type": "error",
            "target": "selective",
            "user_ids": [user_id],
            "read_by": [],
            "created_by": "system",
            "created_at": now,
        })
