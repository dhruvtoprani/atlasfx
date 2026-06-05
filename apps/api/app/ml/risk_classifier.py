from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from time import monotonic

import httpx
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

from app.models.countries import SUPPORTED_CURRENCIES, Country
from app.ml.news_sentiment import evaluate_news_model
from app.schemas.ml import MlFeatureImportance, MlMetricReport, MlModelInfo, MlSignal
from app.services.fx import historical_rates
from app.services.scoring import annualized_volatility, depreciation_percent


CLASS_LABELS = ["Stable", "Watchlist", "Stress", "Crisis Risk"]
FEATURE_NAMES = [
    "fx_depreciation_30d",
    "fx_depreciation_90d",
    "fx_volatility_30d",
    "fx_volatility_90d",
    "fx_trend_acceleration",
]
MODEL_TYPE = "FX regime classifier"
MODEL_CACHE_TTL_SECONDS = 60 * 60 * 24
_MODEL_CACHE: tuple[float, "ClassifierState"] | None = None

RatePoint = tuple[date, float]


@dataclass(frozen=True)
class TrainingExample:
    currency: str
    as_of: date
    features: list[float]
    label: str


@dataclass(frozen=True)
class ClassifierState:
    model: Pipeline | RandomForestClassifier
    selected_model: str
    metrics: MlMetricReport
    model_comparison: dict[str, MlMetricReport]
    feature_importance: list[MlFeatureImportance]


def label_future_depreciation(future_depreciation: float) -> str:
    if future_depreciation < 3:
        return "Stable"
    if future_depreciation < 7:
        return "Watchlist"
    if future_depreciation < 15:
        return "Stress"
    return "Crisis Risk"


def parse_history_points(history: dict, currency: str) -> list[RatePoint]:
    points: list[RatePoint] = []
    for day, rates in history.get("rates", {}).items():
        if not isinstance(rates, dict) or rates.get(currency) is None:
            continue
        points.append((datetime.strptime(day, "%Y-%m-%d").date(), float(rates[currency])))
    return sorted(points, key=lambda point: point[0])


def value_on_or_before(points: list[RatePoint], target: date) -> RatePoint | None:
    eligible = [point for point in points if point[0] <= target]
    return eligible[-1] if eligible else None


def value_on_or_after(points: list[RatePoint], target: date) -> RatePoint | None:
    eligible = [point for point in points if point[0] >= target]
    return eligible[0] if eligible else None


def feature_vector(points: list[RatePoint], as_of: date) -> list[float] | None:
    current = value_on_or_before(points, as_of)
    start_30 = value_on_or_before(points, as_of - timedelta(days=30))
    start_90 = value_on_or_before(points, as_of - timedelta(days=90))
    if current is None or start_30 is None or start_90 is None:
        return None

    rates_30 = [rate for day, rate in points if as_of - timedelta(days=30) <= day <= as_of]
    rates_90 = [rate for day, rate in points if as_of - timedelta(days=90) <= day <= as_of]
    if len(rates_30) < 5 or len(rates_90) < 20:
        return None

    depreciation_30d = depreciation_percent(start_30[1], current[1])
    depreciation_90d = depreciation_percent(start_90[1], current[1])
    volatility_30d = annualized_volatility(rates_30)
    volatility_90d = annualized_volatility(rates_90)
    trend_acceleration = depreciation_30d - (depreciation_90d / 3)

    return [
        round(depreciation_30d, 4),
        round(depreciation_90d, 4),
        round(volatility_30d, 4),
        round(volatility_90d, 4),
        round(trend_acceleration, 4),
    ]


def build_training_examples(history: dict, step_days: int = 7) -> list[TrainingExample]:
    examples: list[TrainingExample] = []
    for currency in SUPPORTED_CURRENCIES:
        points = parse_history_points(history, currency)
        for index in range(90, max(90, len(points) - 30), step_days):
            as_of, current_rate = points[index]
            features = feature_vector(points, as_of)
            future = value_on_or_after(points, as_of + timedelta(days=30))
            if features is None or future is None:
                continue
            future_depreciation = depreciation_percent(current_rate, future[1])
            examples.append(
                TrainingExample(
                    currency=currency,
                    as_of=as_of,
                    features=features,
                    label=label_future_depreciation(future_depreciation),
                )
            )

    return sorted(examples, key=lambda example: example.as_of)


def train_classifier(examples: list[TrainingExample]) -> ClassifierState:
    if len(examples) < 40 or len({example.label for example in examples}) < 2:
        raise ValueError("Not enough historical class variety to train classifier")

    labels = [example.label for example in examples]
    train_examples, test_examples = train_test_split(
        examples,
        test_size=0.25,
        random_state=42,
        stratify=labels,
    )

    x_train, y_train, x_test, y_test = split_feature_arrays(train_examples, test_examples)

    candidates: dict[str, Pipeline | RandomForestClassifier] = {
        "Logistic Regression": Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                (
                    "classifier",
                    LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42),
                ),
            ]
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=240,
            min_samples_leaf=3,
            class_weight="balanced_subsample",
            random_state=42,
            n_jobs=-1,
        ),
    }

    comparison: dict[str, MlMetricReport] = {}
    for name, candidate in candidates.items():
        candidate.fit(x_train, y_train)
        comparison[name] = evaluate_candidate(
            candidate,
            x_test,
            y_test,
            len(train_examples),
            len(test_examples),
            examples,
        )

    selected_name = max(
        comparison,
        key=lambda name: (
            comparison[name].macro_f1 or 0,
            comparison[name].crisis_recall or 0,
            comparison[name].accuracy or 0,
        ),
    )
    model = candidates[selected_name]
    metrics = comparison[selected_name]

    return ClassifierState(
        model=model,
        selected_model=selected_name,
        metrics=metrics,
        model_comparison=comparison,
        feature_importance=extract_feature_importance(model),
    )


def split_feature_arrays(
    train_examples: list[TrainingExample],
    test_examples: list[TrainingExample],
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    return (
        np.array([example.features for example in train_examples]),
        np.array([example.label for example in train_examples]),
        np.array([example.features for example in test_examples]),
        np.array([example.label for example in test_examples]),
    )


def evaluate_candidate(
    model: Pipeline | RandomForestClassifier,
    x_test: np.ndarray,
    y_test: np.ndarray,
    train_count: int,
    test_count: int,
    examples: list[TrainingExample],
) -> MlMetricReport:
    predictions = model.predict(x_test)
    class_distribution = {
        label: sum(1 for example in examples if example.label == label) for label in CLASS_LABELS
    }
    return MlMetricReport(
        accuracy=round(float(accuracy_score(y_test, predictions)), 3),
        macro_f1=round(float(f1_score(y_test, predictions, average="macro", zero_division=0)), 3),
        crisis_precision=round(
            float(
                precision_score(
                    y_test,
                    predictions,
                    labels=["Crisis Risk"],
                    average="macro",
                    zero_division=0,
                )
            ),
            3,
        ),
        crisis_recall=round(
            float(
                recall_score(
                    y_test,
                    predictions,
                    labels=["Crisis Risk"],
                    average="macro",
                    zero_division=0,
                )
            ),
            3,
        ),
        training_examples=train_count,
        test_examples=test_count,
        class_distribution=class_distribution,
    )


def extract_feature_importance(
    model: Pipeline | RandomForestClassifier,
) -> list[MlFeatureImportance]:
    if isinstance(model, Pipeline):
        classifier = model.named_steps["classifier"]
        values = np.abs(classifier.coef_).mean(axis=0)
    else:
        values = model.feature_importances_

    total = float(values.sum()) or 1.0
    return sorted(
        [
            MlFeatureImportance(feature=feature, importance=round(float(value / total), 3))
            for feature, value in zip(FEATURE_NAMES, values, strict=True)
        ],
        key=lambda item: item.importance,
        reverse=True,
    )


async def get_classifier_state() -> ClassifierState:
    global _MODEL_CACHE

    if _MODEL_CACHE and monotonic() - _MODEL_CACHE[0] < MODEL_CACHE_TTL_SECONDS:
        return _MODEL_CACHE[1]

    history = await historical_rates(
        symbols=SUPPORTED_CURRENCIES,
        start=date.today() - timedelta(days=365 * 7),
        end=date.today(),
    )
    state = train_classifier(build_training_examples(history))
    _MODEL_CACHE = (monotonic(), state)
    return state


async def model_info() -> MlModelInfo:
    try:
        state = await get_classifier_state()
    except (httpx.HTTPError, ValueError, KeyError) as error:
        return unavailable_model_info(str(error))

    return MlModelInfo(
        model_type=f"{MODEL_TYPE}: {state.selected_model}",
        status="trained",
        selected_model=state.selected_model,
        source="Frankfurter historical FX windows; labels are future 30-day depreciation buckets",
        labels=CLASS_LABELS,
        features=FEATURE_NAMES,
        metrics=state.metrics,
        model_comparison=state.model_comparison,
        feature_importance=state.feature_importance,
        nlp_evaluation=evaluate_news_model(),
        limitations=[
            "Baseline classifier is FX-regime-only; news and macro are used in the AtlasFX score but not yet in historical ML features.",
            "Reported metrics use a stratified holdout because crisis labels are rare; chronological backtesting is a next step.",
            "Labels are derived from future 30-day depreciation, not observed crisis declarations.",
            "AtlasFX is not financial advice.",
        ],
    )


def unavailable_model_info(reason: str) -> MlModelInfo:
    return MlModelInfo(
        model_type=MODEL_TYPE,
        status=f"unavailable: {reason}",
        selected_model=None,
        source="Frankfurter historical FX windows",
        labels=CLASS_LABELS,
        features=FEATURE_NAMES,
        metrics=None,
        feature_importance=[],
        limitations=[
            "Classifier requires historical Frankfurter coverage and at least two observed label classes.",
            "AtlasFX is not financial advice.",
        ],
    )


async def country_ml_signal(country: Country, history: dict) -> MlSignal:
    if not country.frankfurter_supported or country.currency == "USD":
        return MlSignal(
            country_code=country.country_code,
            country_name=country.country_name,
            currency=country.currency,
            status="unavailable",
            model_type=MODEL_TYPE,
            predicted_label=None,
            crisis_probability=None,
            class_probabilities={},
            features={},
            top_features=[],
            training_examples=None,
            source="No Frankfurter historical FX coverage for this currency.",
        )

    points = parse_history_points(history, country.currency)
    if not points:
        return MlSignal(
            country_code=country.country_code,
            country_name=country.country_name,
            currency=country.currency,
            status="unavailable",
            model_type=MODEL_TYPE,
            predicted_label=None,
            crisis_probability=None,
            class_probabilities={},
            features={},
            top_features=[],
            training_examples=None,
            source="Country history unavailable for current ML feature extraction.",
        )

    features = feature_vector(points, points[-1][0])
    if features is None:
        return MlSignal(
            country_code=country.country_code,
            country_name=country.country_name,
            currency=country.currency,
            status="unavailable",
            model_type=MODEL_TYPE,
            predicted_label=None,
            crisis_probability=None,
            class_probabilities={},
            features={},
            top_features=[],
            training_examples=None,
            source="Not enough recent FX history to compute ML features.",
        )

    try:
        state = await get_classifier_state()
    except (httpx.HTTPError, ValueError, KeyError) as error:
        return MlSignal(
            country_code=country.country_code,
            country_name=country.country_name,
            currency=country.currency,
            status=f"unavailable: {error}",
            model_type=MODEL_TYPE,
            predicted_label=None,
            crisis_probability=None,
            class_probabilities={},
            features=dict(zip(FEATURE_NAMES, features, strict=True)),
            top_features=[],
            training_examples=None,
            source="Classifier training failed.",
        )

    feature_array = np.array([features])
    predicted_label = str(state.model.predict(feature_array)[0])
    probabilities = state.model.predict_proba(feature_array)[0]
    class_probabilities = {
        str(label): round(float(probability), 3)
        for label, probability in zip(state.model.classes_, probabilities, strict=True)
    }

    return MlSignal(
        country_code=country.country_code,
        country_name=country.country_name,
        currency=country.currency,
        status="trained",
        model_type=f"{MODEL_TYPE}: {state.selected_model}",
        predicted_label=predicted_label,
        crisis_probability=class_probabilities.get("Crisis Risk", 0.0),
        class_probabilities=class_probabilities,
        features=dict(zip(FEATURE_NAMES, features, strict=True)),
        top_features=state.feature_importance[:3],
        training_examples=state.metrics.training_examples,
        source=f"Prediction from {state.selected_model} trained on historical Frankfurter FX windows.",
    )
