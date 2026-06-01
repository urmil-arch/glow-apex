from pydantic import BaseModel


class RazorpayCreateRequest(BaseModel):
    """Request to create a Razorpay order and pending SMM order."""
    service_id: str | None = None
    category_name: str | None = None
    link: str
    quantity: int


class RazorpayCreateResponse(BaseModel):
    """Returned to the frontend to open the Razorpay checkout modal."""
    order_id: str          # our internal SMM order id
    razorpay_order_id: str  # Razorpay's order id (e.g. order_xxx)
    key_id: str            # publishable key — safe for frontend
    amount: int            # amount in paise (INR smallest unit) — Razorpay always uses INR
    currency: str
    description: str


class RazorpayVerifyRequest(BaseModel):
    """Sent by the frontend after the user completes payment in the modal."""
    order_id: str               # our internal SMM order id
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
