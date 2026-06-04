from __future__ import annotations

from asyncio import Semaphore, gather
from dataclasses import dataclass
from datetime import datetime, timezone
from time import monotonic

import httpx

from app.config import settings
from app.models.countries import COUNTRIES, Country
from app.schemas.macro import MacroIndicator, MacroSignal
from app.services.scoring import clamp


@dataclass(frozen=True)
class MacroDefinition:
    name: str
    indicator_code: str
    weight: float
    description: str


@dataclass(frozen=True)
class MacroObservation:
    value: float
    year: int


MACRO_DEFINITIONS: tuple[MacroDefinition, ...] = (
    MacroDefinition(
        name="Inflation",
        indicator_code="FP.CPI.TOTL.ZG",
        weight=0.35,
        description="Higher consumer inflation increases macro fragility.",
    ),
    MacroDefinition(
        name="GDP growth",
        indicator_code="NY.GDP.MKTP.KD.ZG",
        weight=0.30,
        description="Weak or negative real growth increases stress.",
    ),
    MacroDefinition(
        name="Unemployment",
        indicator_code="SL.UEM.TOTL.ZS",
        weight=0.20,
        description="Higher unemployment is treated as domestic economic pressure.",
    ),
    MacroDefinition(
        name="Current account",
        indicator_code="BN.CAB.XOKA.GD.ZS",
        weight=0.15,
        description="Current-account deficits increase external funding pressure.",
    ),
)

MACRO_CACHE_TTL_SECONDS = 60 * 60 * 24
NEUTRAL_MACRO_SCORE = 50.0
_MACRO_CACHE: tuple[float, dict[str, MacroSignal]] | None = None


def world_bank_codes(countries: tuple[Country, ...] = COUNTRIES) -> list[str]:
    return sorted({country.macro_code for country in countries if country.macro_code})


def score_indicator(indicator_name: str, value: float | None) -> float:
    if value is None:
        return NEUTRAL_MACRO_SCORE

    if indicator_name == "Inflation":
        return round(clamp((value / 25) * 100), 1)
    if indicator_name == "GDP growth":
        return round(clamp(((3 - value) / 8) * 100), 1)
    if indicator_name == "Unemployment":
        return round(clamp((value / 20) * 100), 1)
    if indicator_name == "Current account":
        return round(clamp((-value / 8) * 100), 1)

    return NEUTRAL_MACRO_SCORE


def build_macro_signal(
    country: Country,
    observations: dict[str, MacroObservation],
    source: str = "World Bank API + Atlas macro scoring",
) -> MacroSignal:
    indicators: list[MacroIndicator] = []
    weighted_score = 0.0
    available_weight = 0.0

    for definition in MACRO_DEFINITIONS:
        observation = observations.get(definition.indicator_code)
        value = observation.value if observation else None
        year = observation.year if observation else None
        stress_score = score_indicator(definition.name, value)
        indicators.append(
            MacroIndicator(
                name=definition.name,
                indicator_code=definition.indicator_code,
                value=round(value, 3) if value is not None else None,
                year=year,
                stress_score=stress_score,
                description=definition.description,
            )
        )
        if value is not None:
            weighted_score += stress_score * definition.weight
            available_weight += definition.weight

    if available_weight:
        macro_score = round(weighted_score / available_weight, 1)
    else:
        macro_score = NEUTRAL_MACRO_SCORE
        source = f"{source}; no recent indicator values, neutral no-data score"

    return MacroSignal(
        country_code=country.country_code,
        country_name=country.country_name,
        currency=country.currency,
        as_of=datetime.now(timezone.utc).date().isoformat(),
        source=source,
        macro_stress_score=macro_score,
        indicators=indicators,
    )


async def fetch_indicator_observations(
    indicator_code: str,
    country_codes: list[str],
) -> dict[str, MacroObservation]:
    if not country_codes:
        return {}

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(
            f"{settings.world_bank_base_url}/country/{';'.join(country_codes)}/indicator/{indicator_code}",
            params={
                "format": "json",
                "per_page": 20000,
                "date": "2018:2026",
            },
        )
        response.raise_for_status()
        payload = response.json()

    if not isinstance(payload, list) or len(payload) < 2 or not isinstance(payload[1], list):
        return {}

    observations: dict[str, MacroObservation] = {}
    for item in payload[1]:
        if not isinstance(item, dict) or item.get("value") is None:
            continue

        code = str(item.get("countryiso3code") or "").upper()
        if not code:
            country = item.get("country")
            if isinstance(country, dict):
                code = str(country.get("id") or "").upper()
        if not code:
            continue

        try:
            year = int(str(item.get("date")))
            value = float(item["value"])
        except (TypeError, ValueError):
            continue

        current = observations.get(code)
        if current is None or year > current.year:
            observations[code] = MacroObservation(value=value, year=year)

    return observations


async def all_country_macro_signals(
    countries: tuple[Country, ...] = COUNTRIES,
) -> dict[str, MacroSignal]:
    global _MACRO_CACHE

    if _MACRO_CACHE and monotonic() - _MACRO_CACHE[0] < MACRO_CACHE_TTL_SECONDS:
        return _MACRO_CACHE[1]

    country_codes = world_bank_codes(countries)
    semaphore = Semaphore(4)

    async def fetch_definition(definition: MacroDefinition) -> tuple[str, dict[str, MacroObservation]]:
        async with semaphore:
            try:
                observations = await fetch_indicator_observations(
                    definition.indicator_code,
                    country_codes,
                )
            except (httpx.HTTPError, ValueError, KeyError):
                observations = {}
            return definition.indicator_code, observations

    fetched = await gather(*(fetch_definition(definition) for definition in MACRO_DEFINITIONS))
    observations_by_indicator = dict(fetched)

    signals: dict[str, MacroSignal] = {}
    for country in countries:
        observations = {
            indicator_code: observations[country.macro_code]
            for indicator_code, observations in observations_by_indicator.items()
            if country.macro_code in observations
        }
        source = "World Bank API + Atlas macro scoring"
        if not observations:
            source = "World Bank API unavailable or missing coverage; neutral no-data score"
        signals[country.country_code] = build_macro_signal(country, observations, source)

    _MACRO_CACHE = (monotonic(), signals)
    return signals


async def country_macro_signal(country: Country) -> MacroSignal:
    signals = await all_country_macro_signals()
    return signals.get(country.country_code) or build_macro_signal(
        country,
        {},
        "World Bank API unavailable or missing coverage; neutral no-data score",
    )
