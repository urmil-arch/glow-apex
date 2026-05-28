import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from app.app_components import include_routers
from app.common.config import settings
from app.admin.providers.repository import ProviderRepository
from app.admin.services.repository import CategoryRepository, ServiceRepository
from app.contact.repository import ContactMessageRepository
from app.orders.repository import OrderRepository
from app.tickets.repository import TicketRepository
from app.user_management.repositories.user_repository import UserRepository
from app.user_management.repositories.sign_in_log_repository import SignInLogRepository

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    app.state.db = db

    repo = UserRepository(db)
    await repo.create_indexes()
    await SignInLogRepository(db).create_index()
    await ProviderRepository(db).create_index()
    await CategoryRepository(db).create_index()
    await ServiceRepository(db).create_index()
    await OrderRepository(db).create_index()
    await ContactMessageRepository(db).create_index()
    await TicketRepository(db).create_index()

    yield

    client.close()


app = FastAPI(title="BuyRealViews API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

include_routers(app)
