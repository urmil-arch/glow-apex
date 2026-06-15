from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Cashfree
    CASHFREE_CLIENT_ID: str = ""
    CASHFREE_CLIENT_SECRET: str = ""
    CASHFREE_BASE_URL: str = "https://sandbox.cashfree.com/pg"

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Razorpay
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    # Cryptomus
    CRYPTOMUS_MERCHANT_ID: str = ""
    CRYPTOMUS_API_KEY: str = ""

    # Payeer
    PAYEER_MERCHANT_ID: str = ""
    PAYEER_SECRET_KEY: str = ""
    PAYEER_ENCRYPTION_KEY: str = ""

    # SMM Panel
    POSTLIKES_API_KEY: str = ""

    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "buyrealviews"

    # JWT
    JWT_SECRET_KEY: str = "change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 hours

    # SMTP (Gmail)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    CONTACT_OWNER_EMAIL: str = ""   # Receives contact form submissions; falls back to SMTP_FROM

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""

    # Provider API key encryption — 64 hex chars (32 bytes). Generate with:
    # python -c "import secrets; print(secrets.token_hex(32))"
    API_KEY_ENCRYPTION_SECRET: str = ""

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # App
    BACKEND_BASE_URL: str = "http://localhost:8000"
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    GLOWAPEX_ORIGIN: str = "http://localhost:3001"

    # Cross-domain stores (buyrealviews.com, buyrealsubscribers.com, ...) that a user
    # may be redirected back to after paying on the Glow Apex portal. Comma-separated.
    # The return_origin sent at checkout is validated against this allowlist to prevent
    # open-redirect attacks. FRONTEND_ORIGIN is always allowed implicitly.
    ALLOWED_RETURN_ORIGINS: str = ""

    # Cryptomus inline (on-store) payment — single coin/network at launch.
    CRYPTOMUS_DEFAULT_CURRENCY: str = "USDT"
    CRYPTOMUS_DEFAULT_NETWORK: str = "tron"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_return_origins(self) -> list[str]:
        """Normalized allowlist of origins a user may be returned to after payment."""
        origins = [self.FRONTEND_ORIGIN.rstrip("/")]
        origins.extend(
            o.strip().rstrip("/") for o in self.ALLOWED_RETURN_ORIGINS.split(",") if o.strip()
        )
        # Preserve order, drop duplicates and empties
        seen: set[str] = set()
        result: list[str] = []
        for o in origins:
            if o and o not in seen:
                seen.add(o)
                result.append(o)
        return result

    @property
    def cors_origins(self) -> list[str]:
        """All browser origins permitted by CORS: the stores plus the Glow Apex portal."""
        origins = self.allowed_return_origins + [self.GLOWAPEX_ORIGIN.rstrip("/")]
        seen: set[str] = set()
        result: list[str] = []
        for o in origins:
            if o and o not in seen:
                seen.add(o)
                result.append(o)
        return result


settings = Settings()
