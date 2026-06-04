from datetime import date, timedelta

from app.ml.risk_classifier import build_training_examples, feature_vector, label_future_depreciation


def test_label_future_depreciation_buckets() -> None:
    assert label_future_depreciation(2.9) == "Stable"
    assert label_future_depreciation(3.0) == "Watchlist"
    assert label_future_depreciation(7.0) == "Stress"
    assert label_future_depreciation(15.0) == "Crisis Risk"


def test_feature_vector_uses_fx_windows() -> None:
    start = date(2026, 1, 1)
    points = [(start + timedelta(days=index), 100 + index * 0.1) for index in range(130)]

    features = feature_vector(points, start + timedelta(days=120))

    assert features is not None
    assert len(features) == 5
    assert features[0] > 0
    assert features[2] >= 0


def test_build_training_examples_labels_future_depreciation() -> None:
    history = {
        "rates": {
            (date(2025, 1, 1) + timedelta(days=index)).isoformat(): {"JPY": 100 + index * 0.2}
            for index in range(180)
        }
    }

    examples = build_training_examples(history, step_days=14)

    assert examples
    assert all(example.currency == "JPY" for example in examples)
    assert {example.label for example in examples}
