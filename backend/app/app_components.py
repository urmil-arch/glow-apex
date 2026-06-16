from fastapi import FastAPI

from app.smm.router import router as smm_router
from app.payments.cashfree.router import router as cashfree_router
from app.payments.stripe.router import router as stripe_router
from app.payments.cryptomus.router import router as cryptomus_router
from app.payments.payeer.router import router as payeer_router
from app.payments.razorpay.router import router as razorpay_router
from app.payments.router import router as payments_router
from app.payments.user_router import router as user_payments_router
from app.contact.router import router as contact_router
from app.tickets.router import router as tickets_router
from app.user_management.routers.auth_router import router as auth_router
from app.user_management.routers.profile_router import router as profile_router
from app.admin.router import router as admin_router
from app.orders.router import router as orders_router
from app.public_services.router import router as public_services_router
from app.admin.pricing.router import router as admin_pricing_router
from app.public_pricing.router import router as public_pricing_router
from app.blog.router import public_router as blog_public_router
from app.public_settings.router import router as public_settings_router
from app.checkout.router import router as checkout_router
from app.notifications.router import user_router as notifications_user_router


def include_routers(app: FastAPI) -> None:
    app.include_router(auth_router, prefix="/auth", tags=["Auth"])
    app.include_router(profile_router, prefix="/auth", tags=["Profile"])
    app.include_router(smm_router, prefix="/smm", tags=["SMM"])
    app.include_router(razorpay_router, prefix="/payments/razorpay", tags=["Razorpay"])
    app.include_router(cashfree_router, prefix="/payments/cashfree", tags=["Cashfree"])
    app.include_router(stripe_router, prefix="/payments/stripe", tags=["Stripe"])
    app.include_router(cryptomus_router, prefix="/payments/cryptomus", tags=["Cryptomus"])
    app.include_router(payeer_router, prefix="/payments/payeer", tags=["Payeer"])
    app.include_router(payments_router, prefix="/payments", tags=["Payments"])
    app.include_router(contact_router, prefix="/contact", tags=["Contact"])
    app.include_router(tickets_router, prefix="/tickets", tags=["Tickets"])
    app.include_router(admin_router, prefix="/admin", tags=["Admin"])
    app.include_router(orders_router, prefix="/orders", tags=["Orders"])
    app.include_router(user_payments_router, prefix="/payments", tags=["User Payments"])
    app.include_router(public_services_router, prefix="/services", tags=["Services"])
    app.include_router(admin_pricing_router, prefix="/admin/pricing", tags=["Admin Pricing"])
    app.include_router(public_pricing_router, prefix="/pricing", tags=["Pricing"])
    app.include_router(blog_public_router, prefix="/blogs", tags=["Blogs"])
    app.include_router(public_settings_router, prefix="/settings", tags=["Settings"])
    app.include_router(checkout_router, prefix="/checkout", tags=["Checkout"])
    app.include_router(notifications_user_router, prefix="/notifications", tags=["Notifications"])
