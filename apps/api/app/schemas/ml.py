from pydantic import BaseModel


class MlMetricReport(BaseModel):
    accuracy: float | None
    macro_f1: float | None
    crisis_precision: float | None
    crisis_recall: float | None
    training_examples: int
    test_examples: int
    class_distribution: dict[str, int]


class MlFeatureImportance(BaseModel):
    feature: str
    importance: float


class MlModelInfo(BaseModel):
    model_type: str
    status: str
    source: str
    labels: list[str]
    features: list[str]
    metrics: MlMetricReport | None
    feature_importance: list[MlFeatureImportance]
    limitations: list[str]


class MlSignal(BaseModel):
    country_code: str
    country_name: str
    currency: str
    status: str
    model_type: str
    predicted_label: str | None
    crisis_probability: float | None
    class_probabilities: dict[str, float]
    features: dict[str, float]
    top_features: list[MlFeatureImportance]
    training_examples: int | None
    source: str
