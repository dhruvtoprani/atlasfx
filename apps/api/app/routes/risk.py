from fastapi import APIRouter, HTTPException

from app.models.countries import COUNTRY_BY_CODE
from app.schemas.risk import CountryRiskDetail, GlobalRiskResponse
from app.services.live_fx_risk import live_country_detail, live_country_rows
from app.services.risk_builder import global_risk_mode

router = APIRouter(prefix="/api/risk", tags=["risk"])


@router.get("/global", response_model=GlobalRiskResponse)
async def get_global_risk() -> GlobalRiskResponse:
    result = await live_country_rows()

    return GlobalRiskResponse(
        as_of=result.as_of,
        global_risk_mode=global_risk_mode(result.rows),
        data_source=result.data_source,
        countries=result.rows,
    )


@router.get("/country/{country_code}", response_model=CountryRiskDetail)
async def get_country_risk(
    country_code: str,
    live_news: bool = True,
    live_macro: bool = True,
) -> CountryRiskDetail:
    country = COUNTRY_BY_CODE.get(country_code.upper())
    if not country:
        raise HTTPException(status_code=404, detail="Country is not in the AtlasFX universe.")

    return await live_country_detail(country, include_news=live_news, include_macro=live_macro)
