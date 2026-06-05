# AtlasFX Data Dictionary

## Country Risk Fields

| Field | Type | Description |
| --- | --- | --- |
| `country_code` | string | ISO 3166-1 alpha-3 country code or `EUR` for Eurozone. |
| `country_name` | string | Display name for the country or region. |
| `currency` | string | ISO 4217 currency code. |
| `risk_score` | number | Weighted AtlasFX Stress Score from 0 to 100. |
| `risk_label` | string | Stable, Watchlist, Stress, Storm, or Crisis Risk. |
| `fx_30d_depreciation` | number | Local currency depreciation versus USD over 30 days for monitored non-USD currencies. |
| `fx_volatility_30d` | number | Annualized 30-day volatility using daily log returns for monitored non-USD currencies. |
| `news_stress_score` | number | RSS/GDELT headline stress score from local NLP, or neutral no-data score. |
| `macro_stress_score` | number | World Bank macro stress score, or neutral no-data score. |
| `top_driver` | string | Largest meaningful component contributor to the score. |
| `data_quality` | string | Indicates source coverage and neutral no-data handling. |
| `news_signal` | object | Optional RSS/GDELT and local NLP sentiment/stress payload. |
| `macro_signal` | object | Optional World Bank macro indicator payload. |
| `ml_signal` | object | Optional FX regime classifier payload. |

## Global Risk Fields

| Field | Type | Description |
| --- | --- | --- |
| `as_of` | string | Latest FX date used by the global risk response. |
| `global_risk_mode` | string | Aggregate market-weather label across countries. |
| `data_source` | string | Source summary for FX, news, macro, and neutral no-data handling. |
| `countries` | array | Country risk rows sorted by stress score. |

## Component Scores

| Field | Type | Description |
| --- | --- | --- |
| `fx_depreciation_score` | number | Normalized depreciation stress score, or neutral no-data score if FX is unavailable. |
| `fx_volatility_score` | number | Normalized volatility stress score, or neutral no-data score if FX is unavailable. |
| `news_stress_score` | number | Headline NLP stress score from 0 to 100. |
| `macro_stress_score` | number | World Bank macro stress score from 0 to 100. |

## News Signal Fields

| Field | Type | Description |
| --- | --- | --- |
| `article_count` | number | Article count scored by the local NLP model. |
| `news_stress_score` | number | Normalized headline stress score from 0 to 100. |
| `average_sentiment` | number | Average local sentiment score from -1 to 1. |
| `negative_article_share` | number | Share of articles classified as stress-heavy. |
| `crisis_theme_share` | number | Share of articles with crisis theme matches. |
| `articles` | array | Top scored headlines with URL, source, stress probability, and themes. |

## Macro Signal Fields

| Field | Type | Description |
| --- | --- | --- |
| `macro_stress_score` | number | Weighted World Bank macro stress score from available indicators. |
| `indicators` | array | Latest available inflation, GDP growth, unemployment, and current-account observations. |
| `indicator_code` | string | World Bank indicator code. |
| `value` | number/null | Latest raw indicator value. |
| `year` | number/null | Year of the latest raw indicator value. |
| `stress_score` | number | Indicator-level normalized stress score from 0 to 100. |

## ML Signal Fields

| Field | Type | Description |
| --- | --- | --- |
| `status` | string | `trained`, `unavailable`, or an unavailable reason. |
| `model_type` | string | Classifier family and task. |
| `predicted_label` | string/null | Stable, Watchlist, Stress, Crisis Risk, or null when unavailable. |
| `crisis_probability` | number/null | Model probability assigned to the Crisis Risk class. |
| `class_probabilities` | object | Per-label probabilities from the classifier. |
| `features` | object | Current FX feature vector used for prediction. |
| `top_features` | array | Highest model feature-importance values. |
| `training_examples` | number/null | Historical examples used for model training. |

## Model Evaluation Fields

| Field | Type | Description |
| --- | --- | --- |
| `selected_model` | string/null | Best baseline model selected by macro-F1, crisis recall, then accuracy. |
| `model_comparison` | object | Per-model metrics for logistic regression and random forest. |
| `nlp_evaluation` | object/null | Holdout metrics for the local headline NLP stress model. |
| `accuracy` | number/null | Share of correct predictions in the evaluation split. |
| `macro_f1` | number/null | Macro-averaged F1 across stress labels. |
| `crisis_precision` | number/null | Precision for the Crisis Risk class. |
| `crisis_recall` | number/null | Recall for the Crisis Risk class. |

## Readiness Fields

| Field | Type | Description |
| --- | --- | --- |
| `status` | string | `ready` when all required connector checks pass, otherwise `degraded`. |
| `as_of` | string | UTC timestamp for the readiness report. |
| `countries_loaded` | number | Number of country rows loaded by the global risk payload check. |
| `connectors` | array | Connector-level status rows used by the frontend loading gate. |
| `latency_ms` | number | Connector check latency in milliseconds. |
| `detail` | string | Human-readable connector result or failure detail. |
