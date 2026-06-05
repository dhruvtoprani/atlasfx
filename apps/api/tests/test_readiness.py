from asyncio import run

from app.schemas.system import ConnectorStatus
from app.services import readiness


def test_readiness_report_marks_ready_when_required_checks_pass(monkeypatch) -> None:
    async def healthy_check() -> ConnectorStatus:
        return ConnectorStatus(
            name="AtlasFX API",
            status="healthy",
            required=True,
            latency_ms=1,
            detail="ok",
        )

    async def global_check() -> ConnectorStatus:
        return ConnectorStatus(
            name="Global risk payload",
            status="healthy",
            required=True,
            latency_ms=1,
            detail="Loaded 30 of 30 countries as of 2026-06-04.",
        )

    monkeypatch.setattr(readiness, "check_api", healthy_check)
    monkeypatch.setattr(readiness, "check_frankfurter", healthy_check)
    monkeypatch.setattr(readiness, "check_news", healthy_check)
    monkeypatch.setattr(readiness, "check_macro", healthy_check)
    monkeypatch.setattr(readiness, "check_local_nlp", healthy_check)
    monkeypatch.setattr(readiness, "check_global_risk_payload", global_check)

    report = run(readiness.readiness_report())

    assert report.status == "ready"
    assert report.countries_loaded == 30
    assert len(report.connectors) == 6


def test_readiness_report_marks_degraded_when_required_check_fails(monkeypatch) -> None:
    async def healthy_check() -> ConnectorStatus:
        return ConnectorStatus(
            name="AtlasFX API",
            status="healthy",
            required=True,
            latency_ms=1,
            detail="ok",
        )

    async def failed_check() -> ConnectorStatus:
        return ConnectorStatus(
            name="Frankfurter FX",
            status="unhealthy",
            required=True,
            latency_ms=1,
            detail="failed",
        )

    async def global_check() -> ConnectorStatus:
        return ConnectorStatus(
            name="Global risk payload",
            status="healthy",
            required=True,
            latency_ms=1,
            detail="Loaded 30 of 30 countries as of 2026-06-04.",
        )

    monkeypatch.setattr(readiness, "check_api", healthy_check)
    monkeypatch.setattr(readiness, "check_frankfurter", failed_check)
    monkeypatch.setattr(readiness, "check_news", healthy_check)
    monkeypatch.setattr(readiness, "check_macro", healthy_check)
    monkeypatch.setattr(readiness, "check_local_nlp", healthy_check)
    monkeypatch.setattr(readiness, "check_global_risk_payload", global_check)

    report = run(readiness.readiness_report())

    assert report.status == "degraded"
    assert any(connector.status == "unhealthy" for connector in report.connectors)
