from __future__ import annotations

from asyncio import gather
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from time import monotonic

import httpx

from app.ml.risk_classifier import country_ml_signal
from app.models.countries import COUNTRIES, SUPPORTED_CURRENCIES, Country
from app.schemas.macro import MacroSignal
from app.schemas.news import NewsSignal
from app.schemas.risk import CountryRiskDetail, CountryRiskRow, Driver, SeriesPoint
from app.services.fx import historical_rates
from app.services.macro import all_country_macro_signals, country_macro_signal
from app.services.news import all_country_news_signals, country_news_signal
from app.services.risk_builder import DRIVER_LABELS, score_country_from_signal
from app.services.scoring import annualized_volatility, atlas_score, depreciation_percent, risk_label, top_driver


@dataclass(frozen=True)
class LiveRiskResult:
    as_of: str
    rows: list[CountryRiskRow]
    data_source: str


RatePoint = tuple[date, float]

NEUTRAL_COMPONENT_SCORE = 50.0
DEFAULT_REAL_SIGNAL = {
    "depreciation": 0.0,
    "volatility": 0.0,
    "news": NEUTRAL_COMPONENT_SCORE,
    "macro": NEUTRAL_COMPONENT_SCORE,
}
REAL_DATA_SOURCE_SUMMARY = (
    "Frankfurter FX for all monitored currencies; Google News RSS + Atlas local NLP; "
    "World Bank macro; neutral no-data scoring only when a live source returns no observations"
)
LIVE_RISK_CACHE_TTL_SECONDS = 60 * 10
_LIVE_RISK_CACHE: tuple[float, LiveRiskResult] | None = None


def _parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def currency_points(history: dict, currency: str) -> list[RatePoint]:
    points: list[RatePoint] = []
    for day, rates in history.get("rates", {}).items():
        rate = rates.get(currency)
        if rate is not None:
            points.append((_parse_date(day), float(rate)))

    return sorted(points, key=lambda point: point[0])


def value_on_or_before(points: list[RatePoint], target: date) -> RatePoint | None:
    eligible = [point for point in points if point[0] <= target]
    if eligible:
        return eligible[-1]
    return points[0] if points else None


def fx_signal_from_points(points: list[RatePoint], days: int = 30) -> dict[str, float] | None:
    if len(points) < 2:
        return None

    latest_day, latest_rate = points[-1]
    start_point = value_on_or_before(points, latest_day - timedelta(days=days))
    if start_point is None:
        return None

    window_rates = [rate for day, rate in points if day >= latest_day - timedelta(days=days)]
    if len(window_rates) < 2:
        window_rates = [rate for _, rate in points[-min(len(points), days + 1) :]]

    return {
        "depreciation": round(depreciation_percent(start_point[1], latest_rate), 2),
        "volatility": round(annualized_volatility(window_rates), 2),
    }


def merge_live_fx_signal(country: Country, history: dict) -> tuple[dict[str, float], str]:
    signal = dict(DEFAULT_REAL_SIGNAL)

    if country.currency == "USD":
        signal["fx_depreciation_score"] = 0.0
        signal["fx_volatility_score"] = 0.0
        return signal, "USD base currency"

    live_signal = fx_signal_from_points(currency_points(history, country.currency))
    if not live_signal:
        signal["fx_depreciation_score"] = NEUTRAL_COMPONENT_SCORE
        signal["fx_volatility_score"] = NEUTRAL_COMPONENT_SCORE
        return signal, "Live FX unavailable; neutral no-data FX score"

    signal.update(live_signal)
    return signal, "Live FX from Frankfurter"


def apply_external_signal_values(
    signal: dict[str, float],
    news_signal: NewsSignal | None = None,
    macro_signal: MacroSignal | None = None,
) -> dict[str, float]:
    updated = dict(signal)
    if news_signal:
        updated["news"] = news_signal.news_stress_score
    if macro_signal:
        updated["macro"] = macro_signal.macro_stress_score
    return updated


def compose_data_quality(
    fx_quality: str,
    news_signal: NewsSignal | None = None,
    macro_signal: MacroSignal | None = None,
) -> str:
    news_quality = "RSS/NLP news" if news_signal and news_signal.article_count else "Neutral news no-data"
    macro_quality = (
        "World Bank macro"
        if macro_signal and "neutral no-data" not in macro_signal.source
        else "Neutral macro no-data"
    )
    return f"{fx_quality}; {news_quality}; {macro_quality}"


def meaningful_top_driver(row: CountryRiskRow, fx_quality: str) -> str:
    if "neutral no-data FX score" not in fx_quality:
        return row.top_driver
    if row.macro_stress_score >= row.news_stress_score:
        return "Macro stress"
    return "News stress"


def rows_from_history(
    history: dict,
    news_signals: dict[str, NewsSignal] | None = None,
    macro_signals: dict[str, MacroSignal] | None = None,
) -> list[CountryRiskRow]:
    rows: list[CountryRiskRow] = []
    for country in COUNTRIES:
        news_signal = (news_signals or {}).get(country.country_code)
        macro_signal = (macro_signals or {}).get(country.country_code)
        signal, fx_quality = merge_live_fx_signal(country, history)
        signal = apply_external_signal_values(signal, news_signal, macro_signal)
        row, _, _ = score_country_from_signal(
            country,
            signal,
            compose_data_quality(fx_quality, news_signal, macro_signal),
        )
        row = row.model_copy(update={"top_driver": meaningful_top_driver(row, fx_quality)})
        rows.append(row)

    return sorted(rows, key=lambda row: row.risk_score, reverse=True)


def country_detail_from_history(
    country: Country,
    history: dict,
    news_signal: NewsSignal | None = None,
    macro_signal: MacroSignal | None = None,
) -> CountryRiskDetail:
    signal, fx_quality = merge_live_fx_signal(country, history)
    signal = apply_external_signal_values(signal, news_signal, macro_signal)
    row, breakdown, drivers = score_country_from_signal(
        country,
        signal,
        compose_data_quality(fx_quality, news_signal, macro_signal),
    )
    row = row.model_copy(update={"top_driver": meaningful_top_driver(row, fx_quality)})

    points = currency_points(history, country.currency)
    if country.currency == "USD":
        points = []

    fx_series: list[SeriesPoint] = []
    risk_series: list[SeriesPoint] = []
    news_series: list[SeriesPoint] = []

    if points:
        analysis_points = points[-31:]
        for day, _ in analysis_points:
            subset = [point for point in points if point[0] <= day]
            point_signal = fx_signal_from_points(subset)
            if point_signal is None:
                continue

            series_signal = dict(DEFAULT_REAL_SIGNAL)
            series_signal.update(point_signal)
            series_signal = apply_external_signal_values(series_signal, news_signal, macro_signal)
            series_row, _, _ = score_country_from_signal(country, series_signal, row.data_quality)
            fx_series.append(SeriesPoint(date=day.isoformat(), value=point_signal["depreciation"]))
            risk_series.append(SeriesPoint(date=day.isoformat(), value=series_row.risk_score))
            news_series.append(SeriesPoint(date=day.isoformat(), value=signal["news"]))

    if not risk_series:
        as_of = latest_history_date(history)
        risk_series = [SeriesPoint(date=as_of, value=row.risk_score)]
        news_series = [SeriesPoint(date=as_of, value=signal["news"])]

    return CountryRiskDetail(
        **row.model_dump(),
        summary=_summary_for_row(country, row, news_signal, macro_signal),
        series={"fx": fx_series, "risk_score": risk_series, "news_sentiment": news_series},
        breakdown=breakdown,
        drivers=drivers,
        news_signal=news_signal,
        macro_signal=macro_signal,
    )


def apply_news_signal(detail: CountryRiskDetail, country: Country, news_score: float) -> CountryRiskDetail:
    return _apply_component_overrides(detail, country, news_score=news_score)


def _apply_component_overrides(
    detail: CountryRiskDetail,
    country: Country,
    news_score: float | None = None,
    macro_score: float | None = None,
) -> CountryRiskDetail:
    breakdown = detail.breakdown.model_copy(
        update={
            "news_stress_score": news_score
            if news_score is not None
            else detail.breakdown.news_stress_score,
            "macro_stress_score": macro_score
            if macro_score is not None
            else detail.breakdown.macro_stress_score,
        }
    )
    breakdown_scores = breakdown.model_dump()
    updated_score = atlas_score(
        breakdown.fx_depreciation_score,
        breakdown.fx_volatility_score,
        breakdown.news_stress_score,
        breakdown.macro_stress_score,
    )
    updated_label = risk_label(updated_score)
    updated_top_driver = top_driver(breakdown_scores)
    readable_drivers = [
        Driver(feature=DRIVER_LABELS[feature], impact=round(value / 100, 2))
        for feature, value in sorted(breakdown_scores.items(), key=lambda item: item[1], reverse=True)
    ]
    risk_scale = updated_score / detail.risk_score if detail.risk_score else 1
    updated_series = {
        **detail.series,
        "risk_score": [
            SeriesPoint(date=point.date, value=round(point.value * risk_scale, 1))
            for point in detail.series.get("risk_score", [])
        ],
    }
    if news_score is not None:
        updated_series["news_sentiment"] = [
            SeriesPoint(date=point.date, value=round(news_score, 1))
            for point in detail.series.get("news_sentiment", [])
        ]

    updated_detail_for_summary = detail.model_copy(
        update={
            "risk_score": updated_score,
            "risk_label": updated_label,
            "top_driver": updated_top_driver,
        }
    )

    return detail.model_copy(
        update={
            "risk_score": updated_score,
            "risk_label": updated_label,
            "news_stress_score": round(breakdown.news_stress_score, 1),
            "macro_stress_score": round(breakdown.macro_stress_score, 1),
            "top_driver": updated_top_driver,
            "breakdown": breakdown,
            "drivers": readable_drivers,
            "series": updated_series,
            "summary": _summary_for_row(
                country,
                updated_detail_for_summary,
                detail.news_signal,
                detail.macro_signal,
            ),
        }
    )


def _summary_for_row(
    country: Country,
    row: CountryRiskRow,
    news_signal: NewsSignal | None = None,
    macro_signal: MacroSignal | None = None,
) -> str:
    news_text = (
        "headlines are scored by the local Atlas NLP model"
        if news_signal and news_signal.article_count
        else "news has no live matches and uses a neutral no-data score"
    )
    macro_text = (
        "macro stress uses latest World Bank indicators"
        if macro_signal and "neutral no-data" not in macro_signal.source
        else "macro uses a neutral score because recent World Bank coverage is missing"
    )

    return (
        f"{country.country_name} is classified as {row.risk_label.lower()} with a "
        f"{row.risk_score} AtlasFX score. {row.top_driver} is the largest weighted driver; "
        f"{news_text}, and {macro_text}. AtlasFX is research analytics, not financial advice."
    )


def latest_history_date(history: dict) -> str:
    dates = sorted(history.get("rates", {}).keys())
    if dates:
        return dates[-1]
    return date.today().isoformat()


async def _safe_historical_rates(symbols: tuple[str, ...]) -> dict:
    if not symbols:
        return {"rates": {}}

    try:
        return await historical_rates(
            symbols=symbols,
            start=date.today() - timedelta(days=130),
            end=date.today(),
        )
    except (httpx.HTTPError, ValueError, KeyError):
        return {"rates": {}}


async def live_country_rows() -> LiveRiskResult:
    global _LIVE_RISK_CACHE

    if _LIVE_RISK_CACHE and monotonic() - _LIVE_RISK_CACHE[0] < LIVE_RISK_CACHE_TTL_SECONDS:
        return _LIVE_RISK_CACHE[1]

    history, news_signals, macro_signals = await gather(
        _safe_historical_rates(SUPPORTED_CURRENCIES),
        all_country_news_signals(),
        all_country_macro_signals(),
    )

    result = LiveRiskResult(
        as_of=latest_history_date(history),
        rows=rows_from_history(history, news_signals, macro_signals),
        data_source=REAL_DATA_SOURCE_SUMMARY,
    )
    _LIVE_RISK_CACHE = (monotonic(), result)
    return result


async def live_country_detail(
    country: Country,
    include_news: bool = True,
    include_macro: bool = True,
) -> CountryRiskDetail:
    tasks = []
    if country.currency != "USD":
        tasks.append(_safe_historical_rates((country.currency,)))
    else:
        tasks.append(_safe_historical_rates(tuple()))
    tasks.append(country_news_signal(country) if include_news else _no_news())
    tasks.append(country_macro_signal(country) if include_macro else _no_macro())

    history, news_signal, macro_signal = await gather(*tasks)
    detail = country_detail_from_history(country, history, news_signal, macro_signal)
    ml_signal = await country_ml_signal(country, history)
    return detail.model_copy(update={"ml_signal": ml_signal})


async def _no_news() -> None:
    return None


async def _no_macro() -> None:
    return None
