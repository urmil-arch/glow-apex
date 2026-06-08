import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool

from app.admin.provider_config.repository import RoutingConfigRepository
from app.admin.services.repository import CategoryRepository, ServiceRepository
from app.admin.tasks.repository import TaskRepository
from app.common.config import settings
from app.orders.repository import OrderRepository
from app.payments.ledger_repository import PaymentLedgerRepository
from app.payments.razorpay import service as rzp_service
from app.payments.razorpay.schemas import (
    RazorpayCreateRequest,
    RazorpayCreateResponse,
    RazorpayVerifyRequest,
)
from app.orders.pricing_utils import CATEGORY_TO_SERVICE_TYPE, calc_pricing_charge
from app.orders.provider_api import call_provider
from app.admin.pricing.repository import PricingRepository
from app.admin.providers.repository import ProviderRepository
from app.user_management.utils.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/create", response_model=RazorpayCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_razorpay_order(
    body: RazorpayCreateRequest,
    request: Request,
    user: dict = Depends(get_current_user),
) -> RazorpayCreateResponse:
    """
    Create a pending SMM order in the DB, then create a Razorpay order.
    Returns the Razorpay order details needed to open the frontend modal.
    """
    if not body.service_id and not body.category_name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Provide service_id or category_name")

    db = request.app.state.db
    user_id = str(user["_id"])
    logger.info("[RZP-INITIATE] user=%s | %s", user.get("username", user_id),
                f"service_id={body.service_id}" if body.service_id else f"category='{body.category_name}'")

    # Resolve service via routing config
    if body.service_id:
        service = await ServiceRepository(db).find_by_id(body.service_id)
        if not service:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Service not found")
    else:
        category = await CategoryRepository(db).find_by_name(body.category_name)
        if not category:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
        routing_cfg = await RoutingConfigRepository(db).find_by_category_id(str(category["_id"]))
        if routing_cfg and routing_cfg.get("default_service_id"):
            service = await ServiceRepository(db).find_by_id(routing_cfg["default_service_id"])
        else:
            services = await ServiceRepository(db).find_active_by_category_id(str(category["_id"]))
            service = services[0] if services else None
        if not service:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "No active service in category")

    if not service.get("is_active", True):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Service is not available")

    min_qty: int = service.get("min", 1)
    max_qty: int = service.get("max", 1_000_000)
    if body.quantity < min_qty or body.quantity > max_qty:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            f"Quantity must be between {min_qty} and {max_qty}")

    # Resolve category name for the service (needed for pricing lookup)
    if body.category_name:
        category_name_val = body.category_name
    else:
        cat = await CategoryRepository(db).find_by_id(service.get("category_id", ""))
        category_name_val = cat.get("name", "") if cat else ""

    # Use admin pricing page price when a matching package is configured
    server_cost = round(service["rate"] * body.quantity / 1000, 6)
    admin_charge: float | None = None
    service_type_key = CATEGORY_TO_SERVICE_TYPE.get(category_name_val)
    if service_type_key:
        pricing_doc = await PricingRepository(db).find_by_service_type(service_type_key)
        if pricing_doc:
            admin_charge = calc_pricing_charge(pricing_doc, body.quantity)

    charge_usd = max(round(admin_charge if admin_charge is not None else server_cost, 6), 0.50)

    # Apply personal discount
    personal_discount = float(user.get("personal_discount", 0) or 0)
    if personal_discount > 0:
        charge_usd = max(round(charge_usd * (1 - personal_discount / 100), 6), 0.50)
        logger.info("[RZP-INITIATE] Personal discount %.1f%% applied — charge=$%.4f | user=%s",
                    personal_discount, charge_usd, user.get("username", user_id))

    description = f"{category_name_val or service.get('name', 'Order')} × {body.quantity:,}"

    # Create pending order in DB
    order_doc = {
        "user_id": user_id,
        "service_id": str(service["_id"]),
        "service_name": service.get("name", ""),
        "category_name": category_name_val,
        "provider_id": "",
        "provider_order_id": "",
        "link": body.link,
        "quantity": body.quantity,
        "charge": charge_usd,
        "server_cost": server_cost,
        "status": "pending_payment",
        "start_count": "",
        "remains": str(body.quantity),
        "currency": "USD",
        "payment_method": "razorpay",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc),
    }
    order_id = await OrderRepository(db).insert(order_doc)

    # Create Razorpay order
    try:
        rzp_order = await run_in_threadpool(
            rzp_service.create_order,
            amount_usd=charge_usd,
            order_id=order_id,
            description=description,
        )
    except Exception as exc:
        logger.error("[RZP-INITIATE] Failed to create Razorpay order for %s: %s", order_id, exc)
        await OrderRepository(db).update(order_id, {"status": "failed"})
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Failed to create payment session. Please try again.")

    # Create payment record
    now = datetime.now(timezone.utc)
    await PaymentLedgerRepository(db).insert({
        "order_id": order_id,
        "user_id": user_id,
        "user_email": user.get("email", ""),
        "user_username": user.get("username", ""),
        "user_balance": 0.0,
        "amount": charge_usd,
        "currency": "USD",
        "method": "Razorpay",
        "type": "credit",
        "status": "pending",
        "razorpay_order_id": rzp_order["id"],
        "service_name": service.get("name", ""),
        "category_name": category_name_val,
        "quantity": body.quantity,
        "memo": description,
        "created_at": now,
        "updated_at": now,
    })

    logger.info("[RZP-INITIATE] Razorpay order created — order_id=%s | rzp=%s | amount_inr=%s paise",
                order_id, rzp_order["id"], rzp_order["amount"])

    return RazorpayCreateResponse(
        order_id=order_id,
        razorpay_order_id=rzp_order["id"],
        key_id=settings.RAZORPAY_KEY_ID,
        amount=rzp_order["amount"],
        currency=rzp_order["currency"],
        description=description,
    )


@router.post("/verify", status_code=status.HTTP_200_OK)
async def verify_razorpay_payment(
    body: RazorpayVerifyRequest,
    request: Request,
    user: dict = Depends(get_current_user),
) -> dict:
    """
    Verify the Razorpay signature, then place the SMM order.
    Called by the frontend after the user completes payment in the modal.
    """
    logger.info("[RZP-VERIFY] order_id=%s payment_id=%s", body.order_id, body.razorpay_payment_id)

    # Verify HMAC signature
    valid = await run_in_threadpool(
        rzp_service.verify_signature,
        body.razorpay_order_id,
        body.razorpay_payment_id,
        body.razorpay_signature,
    )
    if not valid:
        logger.warning("[RZP-VERIFY] Signature mismatch for order %s", body.order_id)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Payment verification failed. Invalid signature.")

    db = request.app.state.db
    ledger = PaymentLedgerRepository(db)
    repo = OrderRepository(db)

    # Atomic claim — prevents duplicate processing
    claimed = await ledger.claim_for_payment(body.order_id)
    if not claimed:
        logger.info("[RZP-VERIFY] Order %s already processed, skipping", body.order_id)
        return {"status": "already_processed", "order_id": body.order_id}

    order = await repo.find_by_id_admin(body.order_id)
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    # Reflect payment success on the order document
    await repo.update(body.order_id, {"payment_status": "paid"})

    # ── Place SMM order (same logic as Stripe webhook) ──────────────────────
    service_id = order.get("service_id", "")
    service = await ServiceRepository(db).find_by_id(service_id) if service_id else None
    if not service:
        logger.error("[RZP-VERIFY] Service %s not found for order %s", service_id, body.order_id)
        await repo.update(body.order_id, {"status": "failed"})
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Service configuration error.")

    category_id = service.get("category_id", "")
    routing_config = await RoutingConfigRepository(db).find_by_category_id(category_id) if category_id else None
    if routing_config:
        service_ids = []
        if routing_config.get("default_service_id"):
            service_ids.append(routing_config["default_service_id"])
        service_ids.extend(routing_config.get("fallback_service_ids", []))
        candidates = []
        for sid in service_ids:
            svc = await ServiceRepository(db).find_by_id(sid)
            if svc and svc.get("is_active", True):
                candidates.append(svc)
    else:
        candidates = await ServiceRepository(db).find_active_by_category_id(category_id) if category_id else [service]

    logger.info("[RZP-VERIFY] [ORDER %s] Found %d provider candidate(s)", body.order_id, len(candidates))

    placed = False
    for attempt, candidate in enumerate(candidates, start=1):
        label = "DEFAULT" if attempt == 1 else f"FALLBACK #{attempt - 1}"
        provider = await ProviderRepository(db).find_by_id(candidate.get("provider_id", ""))
        if not provider:
            logger.warning("[RZP-VERIFY] [ORDER %s] [%s] No provider found, skipping", body.order_id, label)
            continue

        logger.info("[RZP-VERIFY] [ORDER %s] [%s] Calling provider '%s' — qty=%s",
                    body.order_id, label, provider.get("name"), order["quantity"])
        try:
            result = await call_provider(
                provider["url"], provider["api_key"],
                {"action": "add", "service": candidate["provider_service_id"],
                 "link": order["link"], "quantity": order["quantity"]},
            )
        except Exception as exc:
            logger.warning("[RZP-VERIFY] [ORDER %s] [%s] Provider exception: %s", body.order_id, label, exc)
            continue

        if "error" not in result:
            await repo.update(body.order_id, {
                "provider_id": str(provider["_id"]),
                "provider_order_id": str(result.get("order", "")),
                "status": result.get("status", "Pending"),
            })
            logger.info("[RZP-VERIFY] [ORDER %s] [%s] SUCCESS via '%s' — provider_order_id=%s",
                        body.order_id, label, provider.get("name"), result.get("order"))
            placed = True
            break

        logger.warning("[RZP-VERIFY] [ORDER %s] [%s] Provider '%s' rejected: %s%s",
                       body.order_id, label, provider.get("name"), result.get("error"),
                       " — trying next..." if attempt < len(candidates) else "")

    if not placed:
        logger.error("[RZP-VERIFY] [ORDER %s] All providers failed", body.order_id)
        await repo.update(body.order_id, {"status": "provider_error"})

        task_repo = TaskRepository(db)
        if not await task_repo.exists_for_order(body.order_id, "failed_order"):
            user_info = (order.get("user_info") or [{}])[0]
            now = datetime.now(timezone.utc)
            await task_repo.insert({
                "type": "failed_order",
                "status": "open",
                "priority": "high",
                "title": f"Provider unavailable — {order.get('category_name') or order.get('service_name', 'Unknown')} × {order.get('quantity', 0):,}",
                "description": (
                    f"Order #{body.order_id[-8:]} was paid (${order.get('charge', 0):.4f}) via Razorpay "
                    f"but all {len(candidates)} provider(s) rejected the order. "
                    "Manual fulfilment or refund is required."
                ),
                "notes": "",
                "order_id": body.order_id,
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

    return {"status": "success", "order_id": body.order_id, "payment_id": body.razorpay_payment_id}
