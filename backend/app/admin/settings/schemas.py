from typing import Literal, Optional

from pydantic import BaseModel, EmailStr


class PlatformSettings(BaseModel):
    site_name: str = "Glow Apex"
    support_email: str = "support@glowapex.com"
    currency: Literal["USD", "INR", "EUR"] = "USD"
    maintenance_mode: bool = False


class UpdateSettingsRequest(BaseModel):
    site_name: Optional[str] = None
    support_email: Optional[str] = None
    currency: Optional[Literal["USD", "INR", "EUR"]] = None
    maintenance_mode: Optional[bool] = None
