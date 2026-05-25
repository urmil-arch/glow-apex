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
    CONTACT_OWNER_EMAIL: str = ""  # Receives contact form submissions; falls back to SMTP_FROM

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # App
    BACKEND_BASE_URL: str = "http://localhost:8000"
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
