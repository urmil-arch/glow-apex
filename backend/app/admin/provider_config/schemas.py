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
    default: RoutingConfigServiceInfo | None = None
    fallbacks: list[RoutingConfigServiceInfo] = []


class UpsertRoutingConfigRequest(BaseModel):
    default_service_id: str
    fallback_service_ids: list[str] = []
