import logging

from fastapi import APIRouter, HTTPException

from app.smm import service as smm_service
from app.smm.schemas import AddOrderRequest, ServicesRequest

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/services")
async def get_services(body: ServicesRequest) -> dict:
    """Proxy request to Postlikes SMM panel to retrieve available services."""
    try:
        return await smm_service.get_services(body.apiKey)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("Error fetching services: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to fetch services")


@router.post("/add-order")
async def add_order(body: AddOrderRequest) -> dict:
    """Place a new order on the Postlikes SMM panel."""
    try:
        return await smm_service.add_order(
            service_id=body.serviceId,
            link=body.link,
            quantity=body.quantity,
            api_key=body.apiKey,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("Error adding order: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to add order")
