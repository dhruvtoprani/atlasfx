import pytest

from app.services.scoring import (
    annualized_volatility,
    atlas_score,
    depreciation_percent,
    risk_label,
)


def test_depreciation_positive_when_local_currency_weakens() -> None:
    assert depreciation_percent(100, 110) == pytest.approx(10)


def test_depreciation_negative_when_local_currency_strengthens() -> None:
    assert depreciation_percent(100, 95) == pytest.approx(-5)


def test_annualized_volatility_returns_percentage() -> None:
    volatility = annualized_volatility([100, 102, 101, 104, 103])
    assert volatility > 0


def test_atlas_score_uses_weighted_components() -> None:
    assert atlas_score(100, 0, 0, 0) == 35
    assert atlas_score(0, 100, 0, 0) == 25


def test_risk_labels_cover_score_ranges() -> None:
    assert risk_label(10) == "Stable"
    assert risk_label(30) == "Watchlist"
    assert risk_label(50) == "Stress"
    assert risk_label(70) == "Storm"
    assert risk_label(90) == "Crisis Risk"
