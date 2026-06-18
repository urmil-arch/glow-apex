from typing import Literal
from pydantic import BaseModel, field_validator


class PricingPackage(BaseModel):
    quantity: int
    portal_rate: float = 0.0   # $/1000 rate for this specific package
    discount_type: Literal["none", "fixed", "percentage"] = "none"
    discount_value: float = 0.0
    is_active: bool = True

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v

    @field_validator("discount_value")
    @classmethod
    def discount_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Discount value cannot be negative")
        return v


class ServicePricingRequest(BaseModel):
    display_name: str
    price_per_1000: float
    value_packages: list[PricingPackage] = []
    bulk_packages: list[PricingPackage] = []
    is_active: bool = True

    @field_validator("price_per_1000")
    @classmethod
    def price_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Price per 1000 cannot be negative")
        return v


class ServicePricingResponse(BaseModel):
    service_type: str
    display_name: str
    price_per_1000: float
    value_packages: list[PricingPackage] = []
    bulk_packages: list[PricingPackage] = []
    is_active: bool
