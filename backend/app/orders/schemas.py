from typing import Optional
from pydantic import BaseModel, field_validator


class PlaceOrderRequest(BaseModel):
    service_id: str
    link: str
    quantity: int

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


class PlaceOrderByCategoryRequest(BaseModel):
    category_name: str
    link: str
    quantity: int

    @field_validator("category_name")
    @classmethod
    def category_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Category name is required")
        return v

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


class InitiateStripeOrderRequest(BaseModel):
    """Request body for initiating a Stripe-backed order."""
    link: str
    quantity: int
    service_id: Optional[str] = None
    category_name: Optional[str] = None

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


class OrderResponse(BaseModel):
    id: str
    service_id: str
    service_name: str
    category_name: str = ""
    provider_order_id: str
    link: str
    quantity: int
    charge: float
    status: str
    start_count: str
    remains: str
    currency: str
    payment_method: str = "direct"
    payment_status: str = "N/A"
    created_at: str


class OrderListResponse(BaseModel):
    orders: list[OrderResponse]
    total: int
    page: int
    page_size: int


class RefillResponse(BaseModel):
    refill_id: str


class StripeInitiateResponse(BaseModel):
    order_id: str
    checkout_url: str
    session_id: str
    charge: float
    currency: str
