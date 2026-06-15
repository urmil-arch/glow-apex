import logging
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.admin.provider_config.repository import RoutingConfigRepository
from app.admin.providers.repository import ProviderRepository
from app.admin.services.repository import ServiceRepository
from app.admin.tasks.repository import TaskRepository
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

    Resolves the service's routing config (default + fallbacks in priority order),
    attempts each active provider candidate until one accepts, and updates the order
    document with the provider order id and status. If every candidate fails, marks
    the order 'provider_error' and opens a high-priority failed_order task for manual
    fulfilment.

    Idempotency (claiming the payment so only one caller places the order) is the
    caller's responsibility — this function assumes the claim has already been won.

    Returns True if a provider accepted the order, False otherwise.
    """
    repo = OrderRepository(db)

    service_id = order.get("service_id", "")
    service = await ServiceRepository(db).find_by_id(service_id) if service_id else None
    if not service:
        logger.error("[%s] [ORDER %s] Service %s not found — cannot place SMM order", payment_label, order_id, service_id)
        await repo.update(order_id, {"status": "failed"})
        return False

    candidates = await _resolve_provider_candidates(db, service, order_id, payment_label)
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


async def _resolve_provider_candidates(
    db: AsyncIOMotorDatabase,
    service: dict,
    order_id: str,
    payment_label: str,
) -> list[dict]:
    """Return active provider service candidates in priority order (default first, then fallbacks)."""
    category_id = service.get("category_id", "")
    routing_config = await RoutingConfigRepository(db).find_by_category_id(category_id) if category_id else None

    if not routing_config:
        logger.info("[%s] [ORDER %s] No routing config — using all active services in category", payment_label, order_id)
        return await ServiceRepository(db).find_active_by_category_id(category_id) if category_id else [service]

    service_ids: list[str] = []
    if routing_config.get("default_service_id"):
        service_ids.append(routing_config["default_service_id"])
    service_ids.extend(routing_config.get("fallback_service_ids", []))

    candidates: list[dict] = []
    for sid in service_ids:
        svc = await ServiceRepository(db).find_by_id(sid)
        if svc and svc.get("is_active", True):
            candidates.append(svc)

    logger.info(
        "[%s] [ORDER %s] Routing config — default: %s, fallbacks: %s",
        payment_label, order_id,
        routing_config.get("default_service_id"),
        routing_config.get("fallback_service_ids", []),
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
    now = datetime.now(timezone.utc)
    await task_repo.insert({
        "type": "failed_order",
        "status": "open",
        "priority": "high",
        "title": f"Provider unavailable — {order.get('category_name') or order.get('service_name', 'Unknown')} × {order.get('quantity', 0):,}",
        "description": (
            f"Order #{order_id[-8:]} was paid (${order.get('charge', 0):.4f}) via {payment_label} "
            f"but all {candidate_count} provider(s) rejected the order. Manual fulfilment or refund is required."
        ),
        "notes": "",
        "order_id": order_id,
        "user_id": order.get("user_id", ""),
        "user_email": user_info.get("email", ""),
        "user_username": user_info.get("username", ""),
        "order_link": order.get("link", ""),
        "service_name": order.get("service_name", ""),
        "category_name": order.get("category_name", ""),
        "quantity": order.get("quantity"),
        "charge": order.get("charge"),
        "currency": order.get("currency", "USD"),
        "seen_by_admin": False,
        "resolved_at": None,
        "created_at": now,
        "updated_at": now,
    })
