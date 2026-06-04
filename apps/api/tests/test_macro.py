from app.models.countries import COUNTRY_BY_CODE
from app.services.macro import MacroObservation, build_macro_signal, score_indicator


def test_macro_indicator_scoring_direction() -> None:
    assert score_indicator("Inflation", 20) > score_indicator("Inflation", 2)
    assert score_indicator("GDP growth", -3) > score_indicator("GDP growth", 4)
    assert score_indicator("Unemployment", 18) > score_indicator("Unemployment", 4)
    assert score_indicator("Current account", -6) > score_indicator("Current account", 2)


def test_build_macro_signal_uses_available_world_bank_values() -> None:
    signal = build_macro_signal(
        COUNTRY_BY_CODE["ARG"],
        {
            "FP.CPI.TOTL.ZG": MacroObservation(value=120.0, year=2024),
            "NY.GDP.MKTP.KD.ZG": MacroObservation(value=-1.6, year=2024),
        },
    )

    assert signal.country_code == "ARG"
    assert signal.macro_stress_score > 50
    assert signal.indicators[0].value == 120
    assert signal.indicators[0].year == 2024
