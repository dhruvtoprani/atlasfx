from fastapi import APIRouter, HTTPException

from app.models.countries import COUNTRY_BY_CODE
from app.schemas.risk import CountryRiskDetail, GlobalRiskResponse
from app.services.mock_data import country_detail, country_rows, global_risk_mode
from app.services.live_fx_risk import live_country_detail, live_country_rows

router = APIRouter(prefix="/api/risk", tags=["risk"])


@router.get("/global", response_model=GlobalRiskResponse)
async def get_global_risk(live_fx: bool = True) -> GlobalRiskResponse:
    if live_fx:
        result = await live_country_rows()
        rows = result.rows
        as_of = result.as_of
        data_source = result.data_source
    else:
        rows = country_rows()
        as_of = "mock"
        data_source = "Mock MVP data"

    return GlobalRiskResponse(
        as_of=as_of,
        global_risk_mode=global_risk_mode(rows),
        data_source=data_source,
        countries=rows,
    )


@router.get("/country/{country_code}", response_model=CountryRiskDetail)
async def get_country_risk(
    country_code: str,
    live_fx: bool = True,
    live_news: bool = True,
    live_macro: bool = True,
) -> CountryRiskDetail:
    country = COUNTRY_BY_CODE.get(country_code.upper())
    if not country:
        raise HTTPException(status_code=404, detail="Country is not in the AtlasFX MVP set.")

    if live_fx:
        return await live_country_detail(country, include_news=live_news, include_macro=live_macro)

    return country_detail(country)
