from pydantic import BaseModel
from typing import Optional


class CryptomusCustomerDetails(BaseModel):
    customer_id: str
    customer_name: str
    customer_email: str
    customer_phone: str


class CryptomusCreateRequest(BaseModel):
    order_id: str
    order_amount: str
    order_currency: str
    customer_details: CryptomusCustomerDetails
    order_description: Optional[str] = None
    return_url: Optional[str] = None
    crypto_currency: Optional[str] = None
    network: Optional[str] = None
    discount_percent: Optional[int] = None
