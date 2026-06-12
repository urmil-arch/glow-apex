import json
import logging
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool

from app.admin.pricing.repository import PricingRepository
from app.admin.provider_config.repository import RoutingConfigRepository
from app.admin.providers.repository import ProviderRepository
from app.admin.services.repository import CategoryRepository, ServiceRepository
from app.admin.tasks.repository import TaskRepository
from app.checkout.schemas import (
    CheckoutInitRequest,
    CheckoutInitResponse,
    CheckoutSessionData,
    GuestInitRequest,
    InitWithPreAuthRequest,
    PreAuthInfo,
    PreAuthRequest,
    PreAuthResponse,
    RazorpayVerifyViaTokenRequest,
)
from app.common.config import settings
from app.orders.pricing_utils import CATEGORY_TO_SERVICE_TYPE, calc_pricing_charge
from app.orders.provider_api import call_provider
from app.orders.repository import OrderRepository
from app.payments.ledger_repository import PaymentLedgerRepository
from app.payments.razorpay import service as rzp_service
from app.payments.stripe import service as stripe_service
from app.user_management.utils.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

_SESSION_TTL = 900  # 15 minutes
_KEY_PREFIX = "checkout:portal:"
_PRE_AUTH_PREFIX = "checkout:preauth:"


async def _resolve_service_and_charge(
    body: CheckoutInitRequest,
    user: dict,
    db,
) -> tuple[dict, str, float, float]:
    """
    Resolve the service document, validate quantity, and compute the charge.

    Returns (service, category_name, charge_usd, server_cost).
    Applies admin pricing overrides and the user's personal discount.
    """
    if not body.service_id and not body.category_name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Provide service_id or category_name")

    if body.service_id:
        service = await ServiceRepository(db).find_by_id(body.service_id)
        if not service:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Service not found")
        cat = await CategoryRepository(db).find_by_id(service.get("category_id", ""))
        category_name = cat.get("name", "") if cat else ""
    else:
        category = await CategoryRepository(db).find_by_name(body.category_name)
        if not category:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
        category_name = body.category_name
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
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Quantity must be between {min_qty} and {max_qty}",
        )

    server_cost = round(service["rate"] * body.quantity / 1000, 6)

    admin_charge: float | None = None
    service_type_key = CATEGORY_TO_SERVICE_TYPE.get(category_name)
    if service_type_key:
        pricing_doc = await PricingRepository(db).find_by_service_type(service_type_key)
        if pricing_doc:
            admin_charge = calc_pricing_charge(pricing_doc, body.quantity)

    charge = max(round(admin_charge if admin_charge is not None else server_cost, 6), 0.50)

    personal_discount = float(user.get("personal_discount", 0) or 0)
    if personal_discount > 0:
        charge = max(round(charge * (1 - personal_discount / 100), 6), 0.50)
        logger.info(
            "[CHECKOUT-INIT] Personal discount %.1f%% applied — charge=$%.4f | user=%s",
            personal_discount, charge, user.get("username", str(user.get("_id"))),
        )

    return service, category_name, charge, server_cost


async def _create_checkout_session(
    body: CheckoutInitRequest,
    user: dict,
    db,
    redis,
    glowapex_origin: str,
) -> CheckoutInitResponse:
    """
    Core session creation logic shared by /init and /init-with-pre-auth.
    Creates an order record, a payment gateway session, stores session data in Redis,
    and returns a short-lived token for the Glow Apex checkout page.
    """
    user_id = str(user["_id"])

    service, category_name, charge, server_cost = await _resolve_service_and_charge(body, user, db)
    description = f"{category_name or service.get('name', 'Order')} × {body.quantity:,}"

    order_doc = {
        "user_id": user_id,
        "service_id": str(service["_id"]),
        "service_name": service.get("name", ""),
        "category_name": category_name,
        "provider_id": "",
        "provider_order_id": "",
        "link": body.link.strip(),
        "quantity": body.quantity,
        "charge": charge,
        "server_cost": server_cost,
        "status": "pending_payment",
        "start_count": "",
        "remains": str(body.quantity),
        "currency": "USD",
        "payment_method": body.payment_method,
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc),
    }
    order_id = await OrderRepository(db).insert(order_doc)
    now = datetime.now(timezone.utc)

    session_data: dict = {
        "payment_method": body.payment_method,
        "order_id": order_id,
        "service_name": service.get("name", ""),
        "category_name": category_name,
        "quantity": body.quantity,
        "charge": charge,
        "currency": "USD",
        "link": body.link.strip(),
        "description": description,
    }

    if body.payment_method == "stripe":
        try:
            stripe_result = await run_in_threadpool(
                stripe_service.create_checkout_session,
                order_id=order_id,
                order_amount=str(charge),
                order_currency="USD",
                customer_details={
                    "customer_id": user_id,
                    "customer_name": user.get("full_name", "Customer"),
                    "customer_email": user.get("email", ""),
                    "customer_phone": user.get("phone", "0000000000"),
                },
                order_description=description,
                return_url=f"{glowapex_origin}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{glowapex_origin}/checkout/cancel",
            )
        except Exception as exc:
            logger.error("[CHECKOUT-INIT] Stripe session failed for order %s: %s", order_id, exc)
            await OrderRepository(db).update(order_id, {"status": "failed", "payment_status": "failed"})
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Failed to create payment session. Please try again.")

        await PaymentLedgerRepository(db).insert({
            "order_id": order_id,
            "user_id": user_id,
            "user_email": user.get("email", ""),
            "user_username": user.get("username", ""),
            "user_balance": 0.0,
            "amount": charge,
            "currency": "USD",
            "method": "Stripe",
            "type": "credit",
            "status": "pending",
            "stripe_session_id": stripe_result["session_id"],
            "service_name": service.get("name", ""),
            "category_name": category_name,
            "quantity": body.quantity,
            "memo": description,
            "created_at": now,
            "updated_at": now,
        })

        session_data["checkout_url"] = stripe_result["checkout_url"]
        logger.info("[CHECKOUT-INIT] Stripe session ready — order=%s session=%s", order_id, stripe_result["session_id"])

    else:  # razorpay
        try:
            rzp_order = await run_in_threadpool(
                rzp_service.create_order,
                amount_usd=charge,
                order_id=order_id,
                description=description,
            )
        except Exception as exc:
            logger.error("[CHECKOUT-INIT] Razorpay order failed for order %s: %s", order_id, exc)
            await OrderRepository(db).update(order_id, {"status": "failed"})
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Failed to create payment session. Please try again.")

        await PaymentLedgerRepository(db).insert({
            "order_id": order_id,
            "user_id": user_id,
            "user_email": user.get("email", ""),
            "user_username": user.get("username", ""),
            "user_balance": 0.0,
            "amount": charge,
            "currency": "USD",
            "method": "Razorpay",
            "type": "credit",
            "status": "pending",
            "razorpay_order_id": rzp_order["id"],
            "service_name": service.get("name", ""),
            "category_name": category_name,
            "quantity": body.quantity,
            "memo": description,
            "created_at": now,
            "updated_at": now,
        })

        session_data["razorpay_order_id"] = rzp_order["id"]
        session_data["key_id"] = settings.RAZORPAY_KEY_ID
        session_data["amount_paise"] = rzp_order["amount"]
        logger.info("[CHECKOUT-INIT] Razorpay order ready — order=%s rzp=%s amount=%s paise", order_id, rzp_order["id"], rzp_order["amount"])

    token = secrets.token_urlsafe(32)
    await redis.set(f"{_KEY_PREFIX}{token}", json.dumps(session_data), ex=_SESSION_TTL)

    logger.info("[CHECKOUT-INIT] Portal session created — order=%s method=%s", order_id, body.payment_method)
    return CheckoutInitResponse(token=token, expires_in=_SESSION_TTL)


@router.post("/init", response_model=CheckoutInitResponse, status_code=status.HTTP_201_CREATED)
async def checkout_init(
    body: CheckoutInitRequest,
    request: Request,
    user: dict = Depends(get_current_user),
) -> CheckoutInitResponse:
    """
    Create a pending order and a payment gateway session, then return a short-lived
    token. Glow Apex (D2) uses the token to retrieve session data and redirect the
    user to the payment gateway — no JWT is needed on D2.
    """
    return await _create_checkout_session(
        body, user,
        request.app.state.db,
        request.app.state.redis,
        settings.GLOWAPEX_ORIGIN.rstrip("/"),
    )


@router.get("/session/{token}", response_model=CheckoutSessionData)
async def get_checkout_session(token: str, request: Request) -> CheckoutSessionData:
    """
    Return checkout session data for a given portal token.
    Called by Glow Apex (D2) — the token is the authorization, no JWT needed.
    """
    redis = request.app.state.redis
    raw = await redis.get(f"{_KEY_PREFIX}{token}")
    if not raw:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found or expired")
    return CheckoutSessionData(**json.loads(raw))


# ---------------------------------------------------------------------------
# Pre-auth flow: BRV (D1) creates a pre-auth token so the full checkout form
# can be hosted on Glow Apex (D2) without requiring a JWT on D2.
# ---------------------------------------------------------------------------

@router.post("/pre-auth", response_model=PreAuthResponse, status_code=status.HTTP_201_CREATED)
async def create_pre_auth(
    body: PreAuthRequest,
    request: Request,
    user: dict = Depends(get_current_user),
) -> PreAuthResponse:
    """
    Create a short-lived pre-auth token for a specific service.
    Called by BuyRealViews (D1) when the user clicks 'Order Now'.
    Glow Apex (D2) uses this token to render the checkout form and, on submission,
    to call /init-with-pre-auth without a JWT.
    """
    if not body.service_id and not body.category_name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Provide service_id or category_name")

    db = request.app.state.db
    redis = request.app.state.redis

    if body.service_id:
        service = await ServiceRepository(db).find_by_id(body.service_id)
        if not service:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Service not found")
        cat = await CategoryRepository(db).find_by_id(service.get("category_id", ""))
        category_name = cat.get("name", "") if cat else ""
    else:
        category = await CategoryRepository(db).find_by_name(body.category_name)
        if not category:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
        category_name = body.category_name
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

    pre_auth_data = {
        "user_id": str(user["_id"]),
        "user_email": user.get("email", ""),
        "user_name": user.get("full_name", "Customer"),
        "user_phone": user.get("phone", "0000000000"),
        "user_username": user.get("username", ""),
        "personal_discount": float(user.get("personal_discount", 0) or 0),
        "service_id": str(service["_id"]),
        "category_name": category_name,
        "service_name": service.get("name", ""),
        "min": service.get("min", 1),
        "max": service.get("max", 1_000_000),
    }

    token = secrets.token_urlsafe(32)
    await redis.set(f"{_PRE_AUTH_PREFIX}{token}", json.dumps(pre_auth_data), ex=_SESSION_TTL)

    logger.info("[CHECKOUT-PREAUTH] Token created — service=%s user=%s", str(service["_id"]), str(user["_id"]))
    return PreAuthResponse(pre_auth_token=token, expires_in=_SESSION_TTL)


@router.get("/pre-auth/{token}", response_model=PreAuthInfo)
async def get_pre_auth_info(token: str, request: Request) -> PreAuthInfo:
    """
    Return public service info for a pre-auth token.
    Called by Glow Apex (D2) to populate the checkout form — no JWT needed.
    Does not expose user data.
    """
    redis = request.app.state.redis
    raw = await redis.get(f"{_PRE_AUTH_PREFIX}{token}")
    if not raw:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pre-auth token not found or expired")
    data = json.loads(raw)
    return PreAuthInfo(
        service_name=data.get("service_name", ""),
        category_name=data.get("category_name", ""),
        min=data.get("min", 1),
        max=data.get("max", 1_000_000),
    )


@router.post("/init-with-pre-auth", response_model=CheckoutInitResponse, status_code=status.HTTP_201_CREATED)
async def checkout_init_with_pre_auth(
    body: InitWithPreAuthRequest,
    request: Request,
) -> CheckoutInitResponse:
    """
    Complete checkout from the Glow Apex form using a pre-auth token instead of a JWT.
    Validates the pre-auth token, builds user and service context from stored data,
    then delegates to the shared _create_checkout_session helper.
    The pre-auth token is invalidated after use.
    """
    redis = request.app.state.redis
    raw = await redis.get(f"{_PRE_AUTH_PREFIX}{body.pre_auth_token}")
    if not raw:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pre-auth token not found or expired")

    pre_auth = json.loads(raw)

    init_body = CheckoutInitRequest(
        link=body.link,
        quantity=body.quantity,
        service_id=pre_auth["service_id"],
        payment_method=body.payment_method,
    )

    # Reconstruct user dict from stored pre-auth data — avoids a DB lookup while
    # keeping the same interface expected by _create_checkout_session.
    user = {
        "_id": pre_auth["user_id"],
        "email": pre_auth["user_email"],
        "full_name": pre_auth["user_name"],
        "phone": pre_auth["user_phone"],
        "username": pre_auth.get("user_username", ""),
        "personal_discount": pre_auth.get("personal_discount", 0),
    }

    result = await _create_checkout_session(
        init_body, user,
        request.app.state.db,
        redis,
        settings.GLOWAPEX_ORIGIN.rstrip("/"),
    )

    # Single-use: invalidate after a session is successfully created.
    await redis.delete(f"{_PRE_AUTH_PREFIX}{body.pre_auth_token}")

    logger.info("[CHECKOUT-PREAUTH] Session created from pre-auth — user=%s", pre_auth["user_id"])
    return result


@router.post("/guest-init", response_model=CheckoutInitResponse, status_code=status.HTTP_201_CREATED)
async def checkout_guest_init(
    body: GuestInitRequest,
    request: Request,
) -> CheckoutInitResponse:
    """
    Create a checkout session for unauthenticated (guest) users on Glow Apex.
    The order is associated with the provided email — no user account required.
    Personal discounts do not apply; a minimal user context is constructed from
    the submitted email and name.
    """
    import uuid

    guest_id = str(uuid.uuid4())
    user = {
        "_id": guest_id,
        "email": body.email,
        "full_name": body.name or "Guest",
        "phone": "0000000000",
        "username": "",
        "personal_discount": 0,
    }

    init_body = CheckoutInitRequest(
        link=body.link,
        quantity=body.quantity,
        category_name=body.category_name,
        payment_method=body.payment_method,
    )

    result = await _create_checkout_session(
        init_body, user,
        request.app.state.db,
        request.app.state.redis,
        settings.GLOWAPEX_ORIGIN.rstrip("/"),
    )

    logger.info("[CHECKOUT-GUEST] Session created — category=%s email=%s", body.category_name, body.email)
    return result


@router.post("/verify/razorpay", status_code=status.HTTP_200_OK)
async def verify_razorpay_via_token(
    body: RazorpayVerifyViaTokenRequest,
    request: Request,
) -> dict:
    """
    Verify a Razorpay payment using a checkout portal token instead of a user JWT.
    Called by Glow Apex (D2) after the user completes the Razorpay modal.
    On success, places the SMM order and invalidates the session token.
    """
    redis = request.app.state.redis
    raw = await redis.get(f"{_KEY_PREFIX}{body.session_token}")
    if not raw:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found or expired")

    session_data = json.loads(raw)
    order_id = session_data.get("order_id")
    if not order_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid session data")

    valid = await run_in_threadpool(
        rzp_service.verify_signature,
        body.razorpay_order_id,
        body.razorpay_payment_id,
        body.razorpay_signature,
    )
    if not valid:
        logger.warning("[CHECKOUT-VERIFY-RZP] Signature mismatch for order %s", order_id)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Payment verification failed. Invalid signature.")

    db = request.app.state.db
    ledger = PaymentLedgerRepository(db)
    repo = OrderRepository(db)

    claimed = await ledger.claim_for_payment(order_id)
    if not claimed:
        logger.info("[CHECKOUT-VERIFY-RZP] Order %s already processed", order_id)
        return {"status": "already_processed", "order_id": order_id}

    order = await repo.find_by_id_admin(order_id)
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    await repo.update(order_id, {"payment_status": "paid"})

    service_id = order.get("service_id", "")
    service = await ServiceRepository(db).find_by_id(service_id) if service_id else None
    if not service:
        logger.error("[CHECKOUT-VERIFY-RZP] Service %s not found for order %s", service_id, order_id)
        await repo.update(order_id, {"status": "failed"})
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Service configuration error.")

    category_id = service.get("category_id", "")
    routing_config = await RoutingConfigRepository(db).find_by_category_id(category_id) if category_id else None
    if routing_config:
        service_ids: list[str] = []
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

    placed = False
    for attempt, candidate in enumerate(candidates, start=1):
        label = "DEFAULT" if attempt == 1 else f"FALLBACK #{attempt - 1}"
        provider = await ProviderRepository(db).find_by_id(candidate.get("provider_id", ""))
        if not provider:
            logger.warning("[CHECKOUT-VERIFY-RZP] [ORDER %s] [%s] No provider, skipping", order_id, label)
            continue
        try:
            result = await call_provider(
                provider["url"], provider["api_key"],
                {
                    "action": "add",
                    "service": candidate["provider_service_id"],
                    "link": order["link"],
                    "quantity": order["quantity"],
                },
            )
        except Exception as exc:
            logger.warning("[CHECKOUT-VERIFY-RZP] [ORDER %s] [%s] Provider exception: %s", order_id, label, exc)
            continue

        if "error" not in result:
            await repo.update(order_id, {
                "provider_id": str(provider["_id"]),
                "provider_order_id": str(result.get("order", "")),
                "status": result.get("status", "Pending"),
            })
            logger.info("[CHECKOUT-VERIFY-RZP] [ORDER %s] [%s] SUCCESS via '%s'", order_id, label, provider.get("name"))
            placed = True
            break
        logger.warning("[CHECKOUT-VERIFY-RZP] [ORDER %s] [%s] Rejected: %s", order_id, label, result.get("error"))

    if not placed:
        await repo.update(order_id, {"status": "provider_error"})
        task_repo = TaskRepository(db)
        if not await task_repo.exists_for_order(order_id, "failed_order"):
            user_info = (order.get("user_info") or [{}])[0]
            now = datetime.now(timezone.utc)
            await task_repo.insert({
                "type": "failed_order",
                "status": "open",
                "priority": "high",
                "title": f"Provider unavailable — {order.get('category_name') or order.get('service_name', 'Unknown')} × {order.get('quantity', 0):,}",
                "description": (
                    f"Order #{order_id[-8:]} was paid via Razorpay (Glow Apex portal) "
                    f"but all {len(candidates)} provider(s) rejected it. Manual fulfilment required."
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

    # Invalidate the session token — single use after payment
    await redis.delete(f"{_KEY_PREFIX}{body.session_token}")

    return {"status": "success", "order_id": order_id, "payment_id": body.razorpay_payment_id}
