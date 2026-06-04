from __future__ import annotations

from math import log, sqrt
from statistics import pstdev


WEIGHTS = {
    "fx_depreciation_score": 0.35,
    "fx_volatility_score": 0.25,
    "news_stress_score": 0.20,
    "macro_stress_score": 0.20,
}


def clamp(value: float, minimum: float = 0.0, maximum: float = 100.0) -> float:
    return max(minimum, min(maximum, value))


def risk_label(score: float) -> str:
    if score <= 20:
        return "Stable"
    if score <= 40:
        return "Watchlist"
    if score <= 60:
        return "Stress"
    if score <= 80:
        return "Storm"
    return "Crisis Risk"


def depreciation_percent(start_rate: float, end_rate: float) -> float:
    if start_rate <= 0:
        raise ValueError("start_rate must be positive")
    return ((end_rate / start_rate) - 1) * 100


def annualized_volatility(rates: list[float]) -> float:
    if len(rates) < 2:
        return 0.0

    returns = [log(current / previous) for previous, current in zip(rates, rates[1:])]
    if len(returns) < 2:
        return 0.0

    return pstdev(returns) * sqrt(252) * 100


def depreciation_score(depreciation_30d: float) -> float:
    return clamp((depreciation_30d / 15) * 100)


def volatility_score(volatility_30d: float) -> float:
    return clamp((volatility_30d / 30) * 100)


def atlas_score(
    fx_depreciation_score: float,
    fx_volatility_score: float,
    news_stress_score: float,
    macro_stress_score: float,
) -> float:
    score = (
        WEIGHTS["fx_depreciation_score"] * fx_depreciation_score
        + WEIGHTS["fx_volatility_score"] * fx_volatility_score
        + WEIGHTS["news_stress_score"] * news_stress_score
        + WEIGHTS["macro_stress_score"] * macro_stress_score
    )
    return round(clamp(score), 1)


def top_driver(scores: dict[str, float]) -> str:
    labels = {
        "fx_depreciation_score": "FX depreciation",
        "fx_volatility_score": "FX volatility",
        "news_stress_score": "News stress",
        "macro_stress_score": "Macro stress",
    }
    weighted = {name: scores[name] * WEIGHTS[name] for name in WEIGHTS}
    return labels[max(weighted, key=weighted.get)]
