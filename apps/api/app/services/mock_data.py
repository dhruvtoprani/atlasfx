from __future__ import annotations

from datetime import date, timedelta
from math import sin

from app.models.countries import COUNTRIES, Country
from app.schemas.risk import CountryRiskDetail, CountryRiskRow, Driver, RiskBreakdown, SeriesPoint
from app.services.scoring import (
    atlas_score,
    depreciation_score,
    risk_label,
    top_driver,
    volatility_score,
)


MOCK_SIGNAL_BY_CURRENCY = {
    "USD": {"depreciation": 0.0, "volatility": 4.2, "news": 28, "macro": 25},
    "CAD": {"depreciation": 1.2, "volatility": 7.1, "news": 31, "macro": 29},
    "MXN": {"depreciation": 4.7, "volatility": 13.4, "news": 47, "macro": 44},
    "GBP": {"depreciation": 2.1, "volatility": 9.8, "news": 38, "macro": 33},
    "EUR": {"depreciation": 1.8, "volatility": 8.5, "news": 35, "macro": 31},
    "JPY": {"depreciation": 7.6, "volatility": 16.8, "news": 58, "macro": 42},
    "CHF": {"depreciation": -0.8, "volatility": 6.2, "news": 22, "macro": 18},
    "AUD": {"depreciation": 3.5, "volatility": 11.9, "news": 34, "macro": 37},
    "TRY": {"depreciation": 13.9, "volatility": 28.5, "news": 72, "macro": 86},
    "BRL": {"depreciation": 6.4, "volatility": 19.2, "news": 51, "macro": 55},
    "INR": {"depreciation": 2.8, "volatility": 8.8, "news": 42, "macro": 39},
    "ZAR": {"depreciation": 8.5, "volatility": 23.4, "news": 62, "macro": 59},
    "EGP": {"depreciation": 10.6, "volatility": 25.1, "news": 67, "macro": 78},
    "NGN": {"depreciation": 15.4, "volatility": 33.7, "news": 76, "macro": 88},
    "THB": {"depreciation": 2.5, "volatility": 9.2, "news": 30, "macro": 35},
    "KRW": {"depreciation": 4.1, "volatility": 12.6, "news": 44, "macro": 36},
    "IDR": {"depreciation": 5.6, "volatility": 14.7, "news": 49, "macro": 46},
    "CNY": {"depreciation": 3.2, "volatility": 7.9, "news": 46, "macro": 43},
    "ARS": {"depreciation": 18.2, "volatility": 38.6, "news": 81, "macro": 92},
    "PLN": {"depreciation": 2.9, "volatility": 10.4, "news": 33, "macro": 34},
}

DRIVER_LABELS = {
    "fx_depreciation_score": "FX depreciation",
    "fx_volatility_score": "FX volatility",
    "news_stress_score": "News stress",
    "macro_stress_score": "Macro stress",
}


def score_country_from_signal(
    country: Country,
    signal: dict[str, float],
    data_quality: str | None = None,
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
        data_quality=(
            data_quality
            or ("Static offline fallback" if country.frankfurter_supported else "Static fallback; source support gap")
        ),
    )
    breakdown = RiskBreakdown(**breakdown_scores)
    drivers = [
        Driver(feature=DRIVER_LABELS[feature], impact=round(value / 100, 2))
        for feature, value in sorted(breakdown_scores.items(), key=lambda item: item[1], reverse=True)
    ]
    return row, breakdown, drivers


def _score_country(country: Country) -> tuple[CountryRiskRow, RiskBreakdown, list[Driver]]:
    return score_country_from_signal(country, MOCK_SIGNAL_BY_CURRENCY[country.currency])


def country_rows() -> list[CountryRiskRow]:
    rows = [_score_country(country)[0] for country in COUNTRIES]
    return sorted(rows, key=lambda row: row.risk_score, reverse=True)


def global_risk_mode(rows: list[CountryRiskRow]) -> str:
    average = sum(row.risk_score for row in rows) / len(rows)
    if average > 60:
        return "Storm"
    if average > 40:
        return "Elevated"
    if average > 25:
        return "Watchlist"
    return "Calm"


def country_detail(country: Country) -> CountryRiskDetail:
    row, breakdown, drivers = _score_country(country)
    today = date.today()
    signal = MOCK_SIGNAL_BY_CURRENCY[country.currency]

    fx_series: list[SeriesPoint] = []
    risk_series: list[SeriesPoint] = []
    news_series: list[SeriesPoint] = []
    for index in range(31):
        day = today - timedelta(days=30 - index)
        progress = index / 30
        wave = sin(progress * 3.14159 * 2) * 0.8
        fx_series.append(
            SeriesPoint(
                date=day.isoformat(),
                value=round(progress * signal["depreciation"] + wave, 2),
            )
        )
        risk_series.append(
            SeriesPoint(
                date=day.isoformat(),
                value=round(row.risk_score * (0.72 + progress * 0.28), 1),
            )
        )
        news_series.append(
            SeriesPoint(
                date=day.isoformat(),
                value=round(signal["news"] * (0.82 + progress * 0.18), 1),
            )
        )

    summary = (
        f"{country.country_name} is classified as {row.risk_label.lower()} with a "
        f"{row.risk_score} AtlasFX score. The largest driver is {row.top_driver.lower()}, "
        "while macro and news inputs are clearly labeled MVP mock signals."
    )

    return CountryRiskDetail(
        **row.model_dump(),
        summary=summary,
        series={"fx": fx_series, "risk_score": risk_series, "news_sentiment": news_series},
        breakdown=breakdown,
        drivers=drivers,
    )
