from pydantic import BaseModel
from typing import Optional


class ServicesRequest(BaseModel):
    apiKey: Optional[str] = None


class AddOrderRequest(BaseModel):
    apiKey: Optional[str] = None
    serviceId: str
    link: str
    quantity: int
