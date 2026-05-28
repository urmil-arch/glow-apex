from typing import Optional

from pydantic import BaseModel, field_validator


class ProviderResponse(BaseModel):
    id: str
    name: str
    url: str
    api_key: str
    created_at: str


class CreateProviderRequest(BaseModel):
    name: str
    url: str
    api_key: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Provider name is required")
        return v

    @field_validator("url")
    @classmethod
    def url_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Provider URL is required")
        return v

    @field_validator("api_key")
    @classmethod
    def api_key_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("API key is required")
        return v


class UpdateProviderRequest(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    api_key: Optional[str] = None


class ProviderBalanceResponse(BaseModel):
    balance: str
    currency: str


class ProviderServiceItem(BaseModel):
    service: str
    name: str
    type: str
    category: str
    rate: str
    min: str
    max: str
    refill: bool
    cancel: bool
