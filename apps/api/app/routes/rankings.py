from fastapi import APIRouter

from app.schemas.risk import CountryRiskRow
from app.services.live_fx_risk import live_country_rows

router = APIRouter(prefix="/api", tags=["rankings"])


@router.get("/rankings", response_model=list[CountryRiskRow])
async def get_rankings() -> list[CountryRiskRow]:
    return (await live_country_rows()).rows
