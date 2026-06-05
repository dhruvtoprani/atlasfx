from __future__ import annotations

from app.models.countries import Country
from app.schemas.risk import CountryRiskRow, Driver, RiskBreakdown
from app.services.scoring import (
    atlas_score,
    depreciation_score,
    risk_label,
    top_driver,
    volatility_score,
)


DRIVER_LABELS = {
    "fx_depreciation_score": "FX depreciation",
    "fx_volatility_score": "FX volatility",
    "news_stress_score": "News stress",
    "macro_stress_score": "Macro stress",
}


def score_country_from_signal(
    country: Country,
    signal: dict[str, float],
    data_quality: str,
) -> tuple[CountryRiskRow, RiskBreakdown, list[Driver]]:
    fx_depreciation_score = signal.get(
        "fx_depreciation_score",
        depreciation_score(signal["depreciation"]),
    )
    fx_volatility_score = signal.get(
        "fx_volatility_score",
        volatility_score(signal["volatility"]),
    )
    news_score = signal["news"]
    macro_score = signal["macro"]
    score = atlas_score(fx_depreciation_score, fx_volatility_score, news_score, macro_score)
    breakdown_scores = {
        "fx_depreciation_score": fx_depreciation_score,
        "fx_volatility_score": fx_volatility_score,
        "news_stress_score": news_score,
        "macro_stress_score": macro_score,
    }

    row = CountryRiskRow(
        country_code=country.country_code,
        country_name=country.country_name,
        currency=country.currency,
        region=country.region,
        risk_score=score,
        risk_label=risk_label(score),
        fx_30d_depreciation=round(signal["depreciation"], 1),
        fx_volatility_30d=round(signal["volatility"], 1),
        news_stress_score=round(news_score, 1),
        macro_stress_score=round(macro_score, 1),
        top_driver=top_driver(breakdown_scores),
        data_quality=data_quality,
    )
    breakdown = RiskBreakdown(**breakdown_scores)
    drivers = [
        Driver(feature=DRIVER_LABELS[feature], impact=round(value / 100, 2))
        for feature, value in sorted(breakdown_scores.items(), key=lambda item: item[1], reverse=True)
    ]
    return row, breakdown, drivers


def global_risk_mode(rows: list[CountryRiskRow]) -> str:
    average = sum(row.risk_score for row in rows) / len(rows)
    if average > 60:
        return "Storm"
    if average > 40:
        return "Elevated"
    if average > 25:
        return "Watchlist"
    return "Calm"
