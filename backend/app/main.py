from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.app_components import include_routers
from app.common.config import settings

app = FastAPI(title="BuyRealViews API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

include_routers(app)
