from fastapi import APIRouter, HTTPException

from app.models.countries import COUNTRY_BY_CODE
from app.schemas.macro import MacroSignal
from app.services.macro import all_country_macro_signals, country_macro_signal

router = APIRouter(prefix="/api/macro", tags=["macro"])


@router.get("/global", response_model=list[MacroSignal])
async def get_global_macro() -> list[MacroSignal]:
    signals = await all_country_macro_signals()
    return list(signals.values())


@router.get("/country/{country_code}", response_model=MacroSignal)
async def get_country_macro(country_code: str) -> MacroSignal:
    country = COUNTRY_BY_CODE.get(country_code.upper())
    if not country:
        raise HTTPException(status_code=404, detail="Country is not in the AtlasFX universe.")

    return await country_macro_signal(country)
