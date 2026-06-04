from fastapi import APIRouter

from app.schemas.risk import CountryRiskRow
from app.services.mock_data import country_rows
from app.services.live_fx_risk import live_country_rows

router = APIRouter(prefix="/api", tags=["rankings"])


@router.get("/rankings", response_model=list[CountryRiskRow])
async def get_rankings(live_fx: bool = True) -> list[CountryRiskRow]:
    if live_fx:
        return (await live_country_rows()).rows

    return country_rows()
