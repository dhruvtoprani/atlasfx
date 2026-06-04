from app.models.countries import COUNTRY_BY_CODE
from app.services.live_fx_risk import (
    apply_news_signal,
    country_detail_from_history,
    currency_points,
    fx_signal_from_points,
    rows_from_history,
)


SAMPLE_HISTORY = {
    "base": "USD",
    "rates": {
        "2026-05-01": {"JPY": 150.0, "EUR": 0.90},
        "2026-05-15": {"JPY": 155.0, "EUR": 0.88},
        "2026-05-31": {"JPY": 165.0, "EUR": 0.87},
    },
}


def test_currency_points_sort_rates() -> None:
    assert currency_points(SAMPLE_HISTORY, "JPY") == [
        (__import__("datetime").date(2026, 5, 1), 150.0),
        (__import__("datetime").date(2026, 5, 15), 155.0),
        (__import__("datetime").date(2026, 5, 31), 165.0),
    ]


def test_fx_signal_from_points_detects_depreciation() -> None:
    signal = fx_signal_from_points(currency_points(SAMPLE_HISTORY, "JPY"))

    assert signal is not None
    assert signal["depreciation"] == 10.0
    assert signal["volatility"] > 0


def test_rows_from_history_marks_live_supported_currencies() -> None:
    rows = rows_from_history(SAMPLE_HISTORY)
    japan = next(row for row in rows if row.currency == "JPY")
    argentina = next(row for row in rows if row.currency == "ARS")

    assert japan.data_quality == "Live FX from Frankfurter; Neutral news no-data; Neutral macro no-data"
    assert (
        argentina.data_quality
        == "FX unavailable in Frankfurter; neutral no-data FX score; Neutral news no-data; "
        "Neutral macro no-data"
    )


def test_country_detail_from_history_uses_live_fx_series() -> None:
    detail = country_detail_from_history(COUNTRY_BY_CODE["JPN"], SAMPLE_HISTORY)

    assert detail.data_quality == "Live FX from Frankfurter; Neutral news no-data; Neutral macro no-data"
    assert detail.fx_30d_depreciation == 10.0
    assert detail.series["fx"][-1].value == 10.0
    assert detail.drivers[0].feature in {
        "FX depreciation",
        "FX volatility",
        "News stress",
        "Macro stress",
    }


def test_apply_news_signal_recomputes_score_and_drivers() -> None:
    detail = country_detail_from_history(COUNTRY_BY_CODE["JPN"], SAMPLE_HISTORY)
    updated = apply_news_signal(detail, COUNTRY_BY_CODE["JPN"], 95)

    assert updated.news_stress_score == 95
    assert updated.risk_score > detail.risk_score
    assert updated.breakdown.news_stress_score == 95
    assert any(driver.feature == "News stress" for driver in updated.drivers)
