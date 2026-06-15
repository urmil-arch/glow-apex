from typing import Literal, Optional

from pydantic import BaseModel


class PlatformSettings(BaseModel):
    site_name: str = "Glow Apex"
    support_email: str = "support@glowapex.com"
    currency: Literal["USD", "INR"] = "USD"
    maintenance_mode: bool = False
    payment_stripe_enabled: bool = True
    payment_razorpay_enabled: bool = True
    payment_cryptomus_enabled: bool = True
    social_twitter: str = ""
    social_instagram: str = ""
    social_youtube: str = ""
    social_facebook: str = ""


class UpdateSettingsRequest(BaseModel):
    site_name: Optional[str] = None
    support_email: Optional[str] = None
    currency: Optional[Literal["USD", "INR"]] = None
    maintenance_mode: Optional[bool] = None
    payment_stripe_enabled: Optional[bool] = None
    payment_razorpay_enabled: Optional[bool] = None
    payment_cryptomus_enabled: Optional[bool] = None
    social_twitter: Optional[str] = None
    social_instagram: Optional[str] = None
    social_youtube: Optional[str] = None
    social_facebook: Optional[str] = None
