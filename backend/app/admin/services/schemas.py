from typing import Optional

from pydantic import BaseModel, field_validator


class CategoryResponse(BaseModel):
    id: str
    name: str
    created_at: str


class CreateCategoryRequest(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Category name is required")
        return v


class ServiceResponse(BaseModel):
    id: str
    name: str
    description: str
    service_kind: str
    subscription_name: str
    comments_section: bool
    provider_id: str
    provider_name: str
    provider_service_id: str
    category_id: str
    category_name: str
    type: str
    mode: str
    start_count_type: str
    drip_feed: bool
    price_visible: bool
    rate: float
    overflow: float
    downflow: float
    min: int
    max: int
    provider_rate: float
    provider_min: int
    provider_max: int
    is_active: bool
    admin_note: str
    created_at: str


class CreateServiceRequest(BaseModel):
    name: str
    description: str = ""
    service_kind: str = "service"
    subscription_name: str = ""
    comments_section: bool = False
    provider_id: str
    provider_service_id: str
    category_id: str
    type: str = "Default"
    mode: str = "Auto"
    start_count_type: str = "Catch from supplier"
    drip_feed: bool = False
    price_visible: bool = True
    rate: float
    overflow: float = 0.0
    downflow: float = 0.0
    min: int
    max: int
    provider_rate: float = 0.0
    provider_min: int = 0
    provider_max: int = 0
    is_active: bool = True
    admin_note: str = ""

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Service name is required")
        return v

    @field_validator("rate")
    @classmethod
    def rate_positive(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Rate must be non-negative")
        return v

    @field_validator("min", "max")
    @classmethod
    def quantity_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class UpdateServiceRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    service_kind: Optional[str] = None
    subscription_name: Optional[str] = None
    comments_section: Optional[bool] = None
    provider_id: Optional[str] = None
    provider_service_id: Optional[str] = None
    category_id: Optional[str] = None
    type: Optional[str] = None
    mode: Optional[str] = None
    start_count_type: Optional[str] = None
    drip_feed: Optional[bool] = None
    price_visible: Optional[bool] = None
    rate: Optional[float] = None
    overflow: Optional[float] = None
    downflow: Optional[float] = None
    min: Optional[int] = None
    max: Optional[int] = None
    provider_rate: Optional[float] = None
    provider_min: Optional[int] = None
    provider_max: Optional[int] = None
    is_active: Optional[bool] = None
    admin_note: Optional[str] = None
