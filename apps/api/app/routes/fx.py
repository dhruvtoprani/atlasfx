from fastapi import APIRouter

from app.models.countries import SUPPORTED_CURRENCIES
from app.services.fx import historical_rates, latest_rates

router = APIRouter(prefix="/api/fx", tags=["fx"])


@router.get("/latest")
async def get_latest_fx() -> dict:
    return await latest_rates()


@router.get("/history")
async def get_fx_history() -> dict:
    return await historical_rates(symbols=SUPPORTED_CURRENCIES)
