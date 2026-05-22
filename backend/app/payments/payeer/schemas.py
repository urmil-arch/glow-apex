from pydantic import BaseModel
from typing import Optional


class PayeerCustomerDetails(BaseModel):
    customer_id: str
    customer_name: str
    customer_email: str
    customer_phone: str


class PayeerCreateRequest(BaseModel):
    order_id: str
    order_amount: str
    order_currency: str
    customer_details: PayeerCustomerDetails
    order_description: Optional[str] = None
    return_url: Optional[str] = None
