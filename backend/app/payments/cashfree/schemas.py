from pydantic import BaseModel
from typing import Optional


class CustomerDetails(BaseModel):
    customer_id: str
    customer_name: str
    customer_email: str
    customer_phone: str


class OrderMeta(BaseModel):
    return_url: Optional[str] = None


class CashfreeCreateRequest(BaseModel):
    order_id: str
    order_amount: str
    order_currency: str
    customer_details: CustomerDetails
    order_meta: Optional[OrderMeta] = None
