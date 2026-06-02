from typing import Optional
from pydantic import BaseModel


class PaymentResponse(BaseModel):
    id: str
    display_id: int
    order_id: str
    user_id: str
    user_email: str
    user_username: str
    user_balance: float
    amount: float
    currency: str
    method: str
    type: str          # "credit" | "debit"
    status: str
    service_name: str
    category_name: str = ""
    quantity: int
    memo: str
    # Joined order fields
    order_status: str = ""
    order_link: str = ""
    order_provider_id: str = ""
    created_at: str
    updated_at: str


class PaymentListResponse(BaseModel):
    payments: list[PaymentResponse]
    total: int
    page: int
    page_size: int


class CreateManualPaymentRequest(BaseModel):
    user_id: str
    amount: float
    type: str = "credit"
    memo: Optional[str] = ""
    status: str = "Completed"
