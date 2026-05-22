from pydantic import BaseModel
from typing import Optional, List


class StripeCustomerDetails(BaseModel):
    customer_id: str
    customer_name: str
    customer_email: str
    customer_phone: str


class StripeCreateRequest(BaseModel):
    order_id: str
    order_amount: str
    order_currency: str
    customer_details: StripeCustomerDetails
    order_description: Optional[str] = None
    return_url: Optional[str] = None
    cancel_url: Optional[str] = None
    payment_method_types: Optional[List[str]] = None
