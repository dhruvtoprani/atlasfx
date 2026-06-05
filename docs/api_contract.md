# AtlasFX API Contract

## `GET /health`

```json
{
  "status": "ok",
  "service": "atlasfx-api"
}
```

## `GET /api/risk/global`

Returns live risk rows for the 32-country AtlasFX universe.

```json
{
  "as_of": "2026-06-04",
  "global_risk_mode": "Watchlist",
  "data_source": "Real FX where Frankfurter covers the currency; Google News RSS + Atlas local NLP; World Bank macro; neutral no-data scoring for source gaps",
  "countries": []
}
```

## `GET /api/risk/country/{country_code}`

Returns a country detail payload with rule-based risk scoring, source quality,
RSS/NLP news, World Bank macro, and ML regime prediction when supported.

```json
{
  "country_code": "JPN",
  "country_name": "Japan",
  "currency": "JPY",
  "region": "Asia",
  "risk_score": 31.2,
  "risk_label": "Watchlist",
  "fx_30d_depreciation": 1.4,
  "fx_volatility_30d": 7.8,
  "news_stress_score": 34.5,
  "macro_stress_score": 17.2,
  "top_driver": "News stress",
  "data_quality": "Live FX from Frankfurter; RSS/NLP news; World Bank macro",
  "summary": "Japan is classified as watchlist...",
  "series": {
    "fx": [],
    "risk_score": [],
    "news_sentiment": []
  },
  "breakdown": {
    "fx_depreciation_score": 9.3,
    "fx_volatility_score": 26.0,
    "news_stress_score": 34.5,
    "macro_stress_score": 17.2
  },
  "drivers": [],
  "news_signal": {},
  "macro_signal": {},
  "ml_signal": {}
}
```

## `GET /api/rankings`

Returns the same live country rows as global risk, sorted by risk score
descending.

## `GET /api/news/global`

Returns RSS/GDELT headline matches and local NLP stress scoring for all countries.

## `GET /api/news/country/{country_code}`

Returns headline stress scoring for one country.

## `GET /api/macro/global`

Returns World Bank macro stress scoring for all countries.

## `GET /api/macro/country/{country_code}`

Returns World Bank macro stress scoring for one country.

## `GET /api/model/feature-importance`

Returns classifier status, metrics, feature importance, labels, and limitations.

```json
{
  "model_type": "FX regime classifier: Random Forest",
  "status": "trained",
  "selected_model": "Random Forest",
  "source": "Frankfurter historical FX windows; labels are future 30-day depreciation buckets",
  "labels": ["Stable", "Watchlist", "Stress", "Crisis Risk"],
  "features": [
    "fx_depreciation_30d",
    "fx_depreciation_90d",
    "fx_volatility_30d",
    "fx_volatility_90d",
    "fx_trend_acceleration"
  ],
  "metrics": {
    "accuracy": 0.469,
    "macro_f1": 0.209,
    "crisis_precision": 0.008,
    "crisis_recall": 0.5,
    "training_examples": 5019,
    "test_examples": 1673
  },
  "model_comparison": {},
  "nlp_evaluation": {
    "model_type": "TF-IDF + logistic regression headline stress classifier",
    "holdout_examples": 10,
    "accuracy": 0.9,
    "stress_precision": 1.0,
    "stress_recall": 0.8
  },
  "feature_importance": []
}
```

## `GET /api/model/predict/{country_code}`

Returns a per-country ML regime prediction where Frankfurter supports the
currency.

## Removed Endpoints

Replay endpoints were removed intentionally:

```text
GET /api/replay/events
GET /api/replay/{event_id}
```
