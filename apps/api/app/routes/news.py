from fastapi import APIRouter, HTTPException

from app.models.countries import COUNTRY_BY_CODE
from app.schemas.news import NewsSignal
from app.services.news import all_country_news_signals, country_news_signal

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("/global", response_model=list[NewsSignal])
async def get_global_news() -> list[NewsSignal]:
    signals = await all_country_news_signals()
    return list(signals.values())


@router.get("/country/{country_code}", response_model=NewsSignal)
async def get_country_news(country_code: str) -> NewsSignal:
    country = COUNTRY_BY_CODE.get(country_code.upper())
    if not country:
        raise HTTPException(status_code=404, detail="Country is not in the AtlasFX universe.")

    return await country_news_signal(country)
