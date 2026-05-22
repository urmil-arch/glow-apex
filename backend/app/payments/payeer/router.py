import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import PlainTextResponse

from app.payments.payeer import service as payeer_service
from app.payments.payeer.schemas import PayeerCreateRequest
from app.payments.payeer.utils import is_valid_payeer_ip, verify_payeer_webhook_signature
from app.common.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/create")
async def create_order(body: PayeerCreateRequest) -> dict:
    """Build Payeer payment form data and return the redirect URL."""
    cd = body.customer_details
    if not all([cd.customer_id, cd.customer_name, cd.customer_email, cd.customer_phone]):
        raise HTTPException(status_code=400, detail="Missing required customer details")

    try:
        return payeer_service.create_payment_form(
            order_id=body.order_id,
            order_amount=body.order_amount,
            order_currency=body.order_currency,
            customer_details=cd.model_dump(),
            order_description=body.order_description,
            return_url=body.return_url,
        )
    except Exception as exc:
        logger.error("Error creating Payeer payment form: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/verify")
async def verify_order(orderId: Optional[str] = None) -> dict:
    """Return Payeer payment status.

    Payeer does not provide a status query API; the status is delivered via
    webhook only. This endpoint returns PENDING for any pending/unknown order.
    """
    return {
        "order_id": orderId or "unknown",
        "order_status": "PENDING",
        "payment_method": "Payeer",
        "message": "Payeer does not provide a real-time status API. Status is updated via webhook.",
    }


@router.post("/webhook")
async def payeer_webhook(request: Request) -> PlainTextResponse:
    """Handle Payeer IPN webhook.

    Payeer expects the response body to be exactly '{m_orderid}|success'
    on success or 'error' on failure.

    TODO: Call /smm/add-order after m_status == 'success' is verified.
    """
    client_ip = (
        request.headers.get("x-forwarded-for")
        or request.headers.get("x-real-ip")
        or "unknown"
    )
    if not is_valid_payeer_ip(client_ip):
        logger.error("Payeer webhook from unauthorized IP: %s", client_ip)
        return PlainTextResponse("error", status_code=403)

    try:
        form_data = await request.form()
    except Exception:
        return PlainTextResponse("error", status_code=400)

    m_operation_id = form_data.get("m_operation_id", "")
    m_operation_ps = form_data.get("m_operation_ps", "")
    m_operation_date = form_data.get("m_operation_date", "")
    m_operation_pay_date = form_data.get("m_operation_pay_date", "")
    m_shop = form_data.get("m_shop", "")
    m_orderid = form_data.get("m_orderid", "")
    m_amount = form_data.get("m_amount", "")
    m_curr = form_data.get("m_curr", "")
    m_desc = form_data.get("m_desc", "")
    m_status = form_data.get("m_status", "")
    m_sign = form_data.get("m_sign", "")
    m_params = form_data.get("m_params") or None

    if not m_operation_id or not m_orderid or not m_sign:
        logger.error("Payeer webhook missing required fields")
        return PlainTextResponse("error", status_code=400)

    is_valid = verify_payeer_webhook_signature(
        operation_id=m_operation_id,
        operation_ps=m_operation_ps,
        operation_date=m_operation_date,
        operation_pay_date=m_operation_pay_date,
        shop_id=m_shop,
        order_id=m_orderid,
        amount=m_amount,
        currency=m_curr,
        description=m_desc,
        status=m_status,
        received_signature=m_sign,
        secret_key=settings.PAYEER_SECRET_KEY,
        additional_params=m_params,
    )

    if not is_valid:
        logger.error("Payeer webhook signature verification failed for order %s", m_orderid)
        return PlainTextResponse("error", status_code=400)

    logger.info("Payeer webhook — order: %s, status: %s", m_orderid, m_status)

    if m_status == "success":
        logger.info("Payeer payment confirmed for order %s", m_orderid)

    return PlainTextResponse(f"{m_orderid}|success")
