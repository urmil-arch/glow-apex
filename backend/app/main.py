import logging
import socket
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

# Show INFO+ from all app.* modules so order/payment flow logs are visible
logging.basicConfig(
    level=logging.WARNING,
    format="%(levelname)s | %(name)s | %(message)s",
)
logging.getLogger("app").setLevel(logging.INFO)

import redis.asyncio as aioredis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient

from app.app_components import include_routers
from app.common.config import settings
from app.admin.providers.repository import ProviderRepository
from app.admin.services.repository import CategoryRepository, ServiceRepository
from app.admin.tasks.repository import TaskRepository
from app.blog.repository import BlogRepository
from app.notifications.repository import NotificationRepository
from app.contact.repository import ContactMessageRepository
from app.orders.repository import OrderRepository
from app.payments.ledger_repository import PaymentLedgerRepository
from app.admin.pricing.repository import PricingRepository
from app.tickets.repository import TicketRepository
from app.user_management.repositories.user_repository import UserRepository
from app.user_management.repositories.sign_in_log_repository import SignInLogRepository

logger = logging.getLogger(__name__)

Path("static/blog-images").mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        maxIdleTimeMS=45_000,   # close idle connections after 45s (before MongoDB's 60s timeout)
        serverSelectionTimeoutMS=5_000,
        connectTimeoutMS=5_000,
    )
    db = client[settings.MONGODB_DB_NAME]
    app.state.db = db

    redis_client = aioredis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        max_connections=20,
    )
    app.state.redis = redis_client

    repo = UserRepository(db)
    await repo.create_indexes()
    await repo.backfill_roles()
    await SignInLogRepository(db).create_index()
    await ProviderRepository(db).create_index()
    await CategoryRepository(db).create_index()
    await ServiceRepository(db).create_index()
    await OrderRepository(db).create_index()
    await PaymentLedgerRepository(db).create_indexes()
    await ContactMessageRepository(db).create_index()
    await TicketRepository(db).create_index()
    await PricingRepository(db).create_index()
    await TaskRepository(db).create_indexes()
    await BlogRepository(db).create_indexes()
    await NotificationRepository(db).create_indexes()

    yield

    await redis_client.aclose()
    client.close()


app = FastAPI(title="BuyRealViews API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

include_routers(app)
app.mount("/static", StaticFiles(directory="static"), name="static")