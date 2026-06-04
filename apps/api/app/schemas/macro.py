from pydantic import BaseModel


class MacroIndicator(BaseModel):
    name: str
    indicator_code: str
    value: float | None
    year: int | None
    stress_score: float
    description: str


class MacroSignal(BaseModel):
    country_code: str
    country_name: str
    currency: str
    as_of: str
    source: str
    macro_stress_score: float
    indicators: list[MacroIndicator]
