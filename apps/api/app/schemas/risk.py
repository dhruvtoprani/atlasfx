from pydantic import BaseModel, Field

from app.schemas.ml import MlSignal
from app.schemas.macro import MacroSignal
from app.schemas.news import NewsSignal


class Driver(BaseModel):
    feature: str
    impact: float


class SeriesPoint(BaseModel):
    date: str
    value: float


class CountryRiskRow(BaseModel):
    country_code: str
    country_name: str
    currency: str
    region: str
    risk_score: float
    risk_label: str
    fx_30d_depreciation: float
    fx_volatility_30d: float
    news_stress_score: float
    macro_stress_score: float
    top_driver: str
    data_quality: str


class RiskBreakdown(BaseModel):
    fx_depreciation_score: float
    fx_volatility_score: float
    news_stress_score: float
    macro_stress_score: float


class CountryRiskDetail(CountryRiskRow):
    summary: str
    series: dict[str, list[SeriesPoint]]
    breakdown: RiskBreakdown
    drivers: list[Driver]
    news_signal: NewsSignal | None = None
    macro_signal: MacroSignal | None = None
    ml_signal: MlSignal | None = None


class GlobalRiskResponse(BaseModel):
    as_of: str
    global_risk_mode: str
    data_source: str
    countries: list[CountryRiskRow]
    disclaimer: str = Field(
        default=(
            "AtlasFX is a research and analytics project. It is not financial advice, "
            "investment advice, or a trading recommendation system."
        )
    )
