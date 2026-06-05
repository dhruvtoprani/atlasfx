from __future__ import annotations

from asyncio import gather
from datetime import datetime, timezone
from time import monotonic

from app.ml.news_sentiment import evaluate_news_model
from app.models.countries import COUNTRIES, COUNTRY_BY_CODE
from app.schemas.system import ConnectorStatus, ReadinessResponse
from app.services.fx import latest_rates
from app.services.live_fx_risk import live_country_rows
from app.services.macro import country_macro_signal
from app.services.news import country_news_signal


async def readiness_report() -> ReadinessResponse:
    checks = await gather(
        check_api(),
        check_frankfurter(),
        check_news(),
        check_macro(),
        check_local_nlp(),
        check_global_risk_payload(),
    )
    global_payload = next(check for check in checks if check.name == "Global risk payload")
    status = "ready" if all(check.status == "healthy" for check in checks if check.required) else "degraded"

    return ReadinessResponse(
        status=status,
        as_of=datetime.now(timezone.utc).isoformat(),
        countries_loaded=_extract_country_count(global_payload.detail),
        connectors=checks,
    )


async def check_api() -> ConnectorStatus:
    started = monotonic()
    return _status("AtlasFX API", "healthy", True, started, "FastAPI application is responding.")


async def check_frankfurter() -> ConnectorStatus:
    started = monotonic()
    try:
        payload = await latest_rates()
        rates = payload.get("rates", {})
        if not isinstance(rates, dict) or not rates:
            return _status("Frankfurter FX", "unhealthy", True, started, "Latest rates response had no rates.")
        return _status("Frankfurter FX", "healthy", True, started, f"Latest rates returned {len(rates)} symbols.")
    except Exception as exc:
        return _status("Frankfurter FX", "unhealthy", True, started, _error_detail(exc))


async def check_news() -> ConnectorStatus:
    started = monotonic()
    try:
        signal = await country_news_signal(COUNTRY_BY_CODE["JPN"])
        if "unavailable" in signal.source.lower():
            return _status("News RSS/GDELT", "unhealthy", True, started, signal.source)
        return _status(
            "News RSS/GDELT",
            "healthy",
            True,
            started,
            f"{signal.source}; {signal.article_count} Japan headlines scored.",
        )
    except Exception as exc:
        return _status("News RSS/GDELT", "unhealthy", True, started, _error_detail(exc))


async def check_macro() -> ConnectorStatus:
    started = monotonic()
    try:
        signal = await country_macro_signal(COUNTRY_BY_CODE["JPN"])
        available = sum(1 for indicator in signal.indicators if indicator.value is not None)
        if available == 0:
            return _status("World Bank macro", "unhealthy", True, started, signal.source)
        return _status(
            "World Bank macro",
            "healthy",
            True,
            started,
            f"{signal.source}; {available} Japan indicators loaded.",
        )
    except Exception as exc:
        return _status("World Bank macro", "unhealthy", True, started, _error_detail(exc))


async def check_local_nlp() -> ConnectorStatus:
    started = monotonic()
    try:
        report = evaluate_news_model()
        return _status(
            "Local headline NLP",
            "healthy",
            True,
            started,
            f"{report.model_type}; holdout accuracy {report.accuracy}.",
        )
    except Exception as exc:
        return _status("Local headline NLP", "unhealthy", True, started, _error_detail(exc))


async def check_global_risk_payload() -> ConnectorStatus:
    started = monotonic()
    try:
        result = await live_country_rows()
        expected = len(COUNTRIES)
        if len(result.rows) != expected:
            return _status(
                "Global risk payload",
                "unhealthy",
                True,
                started,
                f"Loaded {len(result.rows)} of {expected} countries.",
            )
        return _status(
            "Global risk payload",
            "healthy",
            True,
            started,
            f"Loaded {len(result.rows)} of {expected} countries as of {result.as_of}.",
        )
    except Exception as exc:
        return _status("Global risk payload", "unhealthy", True, started, _error_detail(exc))


def _status(
    name: str,
    status: str,
    required: bool,
    started: float,
    detail: str,
) -> ConnectorStatus:
    return ConnectorStatus(
        name=name,
        status=status,
        required=required,
        latency_ms=max(0, round((monotonic() - started) * 1000)),
        detail=detail,
    )


def _error_detail(exc: Exception) -> str:
    return f"{exc.__class__.__name__}: {str(exc) or 'connector check failed'}"


def _extract_country_count(detail: str) -> int:
    parts = detail.split()
    for index, part in enumerate(parts):
        if part == "Loaded" and index + 1 < len(parts):
            try:
                return int(parts[index + 1])
            except ValueError:
                return 0
    return 0
