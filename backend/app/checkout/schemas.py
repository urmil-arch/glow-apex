from typing import Optional

from pydantic import BaseModel, field_validator


class CheckoutInitRequest(BaseModel):
    """Request body to create a cross-domain checkout portal session."""

    link: str
    quantity: int
    service_id: Optional[str] = None
    category_name: Optional[str] = None
    payment_method: str  # "stripe" | "razorpay"

    @field_validator("link")
    @classmethod
    def link_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Link is required")
        return v

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v

    @field_validator("payment_method")
    @classmethod
    def valid_method(cls, v: str) -> str:
        if v not in ("stripe", "razorpay"):
            raise ValueError("payment_method must be 'stripe' or 'razorpay'")
        return v


class CheckoutInitResponse(BaseModel):
    token: str
    expires_in: int  # seconds


class CheckoutSessionData(BaseModel):
    """Session data stored in Redis and returned to Glow Apex (D2)."""

    payment_method: str
    order_id: str
    service_name: str
    category_name: str
    quantity: int
    charge: float
    currency: str
    link: str
    description: str
    # Stripe-specific
    checkout_url: Optional[str] = None
    # Razorpay-specific
    razorpay_order_id: Optional[str] = None
    key_id: Optional[str] = None
    amount_paise: Optional[int] = None


class RazorpayVerifyViaTokenRequest(BaseModel):
    """Verify a Razorpay payment using a checkout session token (no JWT required)."""

    session_token: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PreAuthRequest(BaseModel):
    """
    Request body for creating a cross-domain pre-auth token.
    Called by BuyRealViews (D1) before redirecting the user to the Glow Apex checkout form.
    """

    service_id: Optional[str] = None
    category_name: Optional[str] = None


class PreAuthResponse(BaseModel):
    pre_auth_token: str
    expires_in: int  # seconds


class PreAuthInfo(BaseModel):
    """
    Public service info returned to Glow Apex so it can render the checkout form.
    Does not expose user data.
    """

    service_name: str
    category_name: str
    min: int
    max: int


class GuestInitRequest(BaseModel):
    """
    Request body for guest (unauthenticated) checkout on Glow Apex.
    Orders are tracked by email. Personal discounts do not apply.
    """

    category_name: str
    quantity: int
    link: str
    payment_method: str  # "stripe" | "razorpay"
    email: str
    name: Optional[str] = None

    @field_validator("link")
    @classmethod
    def link_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Link is required")
        return v

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v

    @field_validator("payment_method")
    @classmethod
    def valid_method(cls, v: str) -> str:
        if v not in ("stripe", "razorpay"):
            raise ValueError("payment_method must be 'stripe' or 'razorpay'")
        return v

    @field_validator("email")
    @classmethod
    def email_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v or "@" not in v:
            raise ValueError("A valid email is required")
        return v


class InitWithPreAuthRequest(BaseModel):
    """
    Request body for completing checkout from the Glow Apex form.
    Uses a pre_auth_token instead of a JWT — no authentication header required.
    """

    pre_auth_token: str
    quantity: int
    link: str
    payment_method: str  # "stripe" | "razorpay"

    @field_validator("link")
    @classmethod
    def link_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Link is required")
        return v

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v

    @field_validator("payment_method")
    @classmethod
    def valid_method(cls, v: str) -> str:
        if v not in ("stripe", "razorpay"):
            raise ValueError("payment_method must be 'stripe' or 'razorpay'")
        return v
