from __future__ import annotations

from datetime import date, timedelta

import httpx

from app.config import settings
from app.models.countries import SUPPORTED_CURRENCIES


async def latest_rates(base: str = "USD") -> dict:
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(f"{settings.frankfurter_base_url}/latest", params={"base": base})
        response.raise_for_status()
        return response.json()


async def historical_rates(
    base: str = "USD",
    symbols: tuple[str, ...] = SUPPORTED_CURRENCIES,
    start: date | None = None,
    end: date | None = None,
) -> dict:
    end_date = end or date.today()
    start_date = start or (end_date - timedelta(days=120))
    symbol_list = ",".join(symbols)
    path = f"{start_date.isoformat()}..{end_date.isoformat()}"

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(
            f"{settings.frankfurter_base_url}/{path}",
            params={"base": base, "symbols": symbol_list},
        )
        response.raise_for_status()
        return response.json()
