from datetime import date, timedelta

from fastapi import APIRouter, HTTPException

from app.ml.risk_classifier import country_ml_signal, model_info
from app.models.countries import COUNTRY_BY_CODE
from app.schemas.ml import MlFeatureImportance, MlModelInfo, MlSignal
from app.services.fx import historical_rates
from app.services.scoring import WEIGHTS

router = APIRouter(prefix="/api/model", tags=["model"])


@router.get("/feature-importance", response_model=MlModelInfo)
async def get_feature_importance() -> MlModelInfo:
    info = await model_info()
    if not info.feature_importance:
        info.feature_importance.extend(
            [
                MlFeatureImportance(feature=feature, importance=weight)
                for feature, weight in WEIGHTS.items()
            ]
        )
    return info


@router.get("/predict/{country_code}", response_model=MlSignal)
async def predict_country(country_code: str) -> MlSignal:
    country = COUNTRY_BY_CODE.get(country_code.upper())
    if not country:
        raise HTTPException(status_code=404, detail="Country is not in the AtlasFX universe.")

    history = {"rates": {}}
    if country.currency != "USD":
        history = await historical_rates(
            symbols=(country.currency,),
            start=date.today() - timedelta(days=130),
            end=date.today(),
        )
    return await country_ml_signal(country, history)
