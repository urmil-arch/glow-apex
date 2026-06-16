from pydantic import BaseModel


class RoutingConfigServiceInfo(BaseModel):
    service_id: str
    service_name: str
    provider_id: str
    provider_name: str
    provider_service_id: str
    rate: float
    min: int
    max: int


class RoutingConfigResponse(BaseModel):
    category_id: str
    category_name: str
    value_default: RoutingConfigServiceInfo | None = None
    value_fallbacks: list[RoutingConfigServiceInfo] = []
    bulk_default: RoutingConfigServiceInfo | None = None
    bulk_fallbacks: list[RoutingConfigServiceInfo] = []


class UpsertRoutingConfigRequest(BaseModel):
    value_default_service_id: str
    value_fallback_service_ids: list[str] = []
    bulk_default_service_id: str = ""
    bulk_fallback_service_ids: list[str] = []
