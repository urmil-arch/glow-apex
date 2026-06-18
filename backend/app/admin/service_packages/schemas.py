from typing import Literal
from pydantic import BaseModel, Field


class FallbackServiceCreate(BaseModel):
    provider_id: str
    provider_service_id: str
    provider_service_name: str
    provider_name: str
    provider_rate: float
    min: int
    max: int
    is_active: bool = True
    description: str = ""
    service_label: str = ""
    mode: Literal["manual", "auto"] = "manual"
    start_count_type: Literal["supplier", "custom", "zero"] = "supplier"


class FallbackServiceOut(FallbackServiceCreate):
    pass


class ServicePackageCreate(BaseModel):
    service_type: Literal[
        "youtube_views",
        "youtube_likes",
        "youtube_subscribers",
        "youtube_comments",
        "youtube_shorts_views",
        "youtube_shorts_likes",
    ]
    package_type: Literal["value", "bulk"]
    quantity: int = Field(gt=0)

    # Default fulfillment service
    provider_id: str
    provider_service_id: str
    provider_service_name: str
    provider_name: str
    provider_rate: float = Field(ge=0)   # $/1000 from provider API

    # Portal pricing
    portal_rate: float = Field(ge=0)     # $/1000 admin sets
    discount_type: Literal["none", "fixed", "percentage"] = "none"
    discount_value: float = Field(default=0.0, ge=0)

    # Provider constraints (read-only reference; sourced from provider API)
    min: int = Field(ge=0)
    max: int = Field(ge=0)

    # Config
    is_active: bool = True
    admin_note: str = ""

    # Client-facing metadata (stored but not used in fulfillment flow)
    description: str = ""
    service_label: str = ""
    mode: Literal["manual", "auto"] = "manual"
    start_count_type: Literal["supplier", "custom", "zero"] = "supplier"


class ServicePackageUpdate(BaseModel):
    provider_id: str | None = None
    provider_service_id: str | None = None
    provider_service_name: str | None = None
    provider_name: str | None = None
    provider_rate: float | None = None
    portal_rate: float | None = None
    discount_type: Literal["none", "fixed", "percentage"] | None = None
    discount_value: float | None = None
    min: int | None = None
    max: int | None = None
    priority: int | None = None
    is_active: bool | None = None
    admin_note: str | None = None
    description: str | None = None
    service_label: str | None = None
    mode: Literal["manual", "auto"] | None = None
    start_count_type: Literal["supplier", "custom", "zero"] | None = None


class FallbacksReorderRequest(BaseModel):
    fallbacks: list[FallbackServiceOut]


class RoutingEntry(BaseModel):
    """A single entry in the combined routing stack (default or fallback)."""
    provider_id: str
    provider_service_id: str
    provider_service_name: str
    provider_name: str
    provider_rate: float
    min: int
    max: int
    is_active: bool = True
    description: str = ""
    service_label: str = ""
    mode: Literal["manual", "auto"] = "manual"
    start_count_type: Literal["supplier", "custom", "zero"] = "supplier"


class RoutingReorderRequest(BaseModel):
    """
    Full routing stack reorder payload.
    entries[0] becomes the new default provider service.
    entries[1:] become the new ordered fallbacks list.
    """
    entries: list[RoutingEntry] = Field(min_length=1)


class ServicePackageOut(BaseModel):
    id: str
    service_type: str
    package_type: str
    quantity: int
    provider_id: str
    provider_service_id: str
    provider_service_name: str
    provider_name: str
    provider_rate: float
    portal_rate: float
    discount_type: str
    discount_value: float
    min: int
    max: int
    priority: int
    is_active: bool
    admin_note: str
    description: str
    service_label: str
    mode: str
    start_count_type: str
    fallbacks: list[FallbackServiceOut]
    created_at: str
    updated_at: str
