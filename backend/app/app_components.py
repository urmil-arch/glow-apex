from fastapi import FastAPI

from app.smm.router import router as smm_router
from app.payments.cashfree.router import router as cashfree_router
from app.payments.stripe.router import router as stripe_router
from app.payments.cryptomus.router import router as cryptomus_router
from app.payments.payeer.router import router as payeer_router
from app.payments.router import router as payments_router
from app.contact.router import router as contact_router
from app.user_management.routers.auth_router import router as auth_router
from app.user_management.routers.profile_router import router as profile_router


def include_routers(app: FastAPI) -> None:
    app.include_router(auth_router, prefix="/auth", tags=["Auth"])
    app.include_router(profile_router, prefix="/auth", tags=["Profile"])
    app.include_router(smm_router, prefix="/smm", tags=["SMM"])
    app.include_router(cashfree_router, prefix="/payments/cashfree", tags=["Cashfree"])
    app.include_router(stripe_router, prefix="/payments/stripe", tags=["Stripe"])
    app.include_router(cryptomus_router, prefix="/payments/cryptomus", tags=["Cryptomus"])
    app.include_router(payeer_router, prefix="/payments/payeer", tags=["Payeer"])
    app.include_router(payments_router, prefix="/payments", tags=["Payments"])
    app.include_router(contact_router, prefix="/contact", tags=["Contact"])
