from pydantic import BaseModel, field_validator


class AdminOrderResponse(BaseModel):
    id: str
    user_id: str
    user_email: str
    user_username: str
    service_id: str
    service_name: str
    category_name: str = ""
    provider_id: str
    provider_order_id: str
    link: str
    quantity: int
    charge: float
    status: str
    start_count: str
    remains: str
    currency: str
    payment_method: str = "direct"
    payment_status: str = ""
    created_at: str


class AdminOrderListResponse(BaseModel):
    orders: list[AdminOrderResponse]
    total: int
    page: int
    page_size: int


class UpdateLinkRequest(BaseModel):
    link: str

    @field_validator("link")
    @classmethod
    def link_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Link cannot be empty")
        return v


class UpdateServiceRequest(BaseModel):
    service_id: str
    service_name: str


class SetCountRequest(BaseModel):
    value: str


class SetPartialRequest(BaseModel):
    remains: str


class ChangeStatusRequest(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def status_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Status cannot be empty")
        return v


class ResendOrderRequest(BaseModel):
    """Admin-initiated resend to a custom provider and service."""
    provider_id: str
    provider_service_id: str
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v
