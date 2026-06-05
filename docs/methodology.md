# AtlasFX Methodology

AtlasFX currently uses the PRD rule-based score:

```text
AtlasFX Stress Score =
0.35 * FX Depreciation Score
+ 0.25 * FX Volatility Score
+ 0.20 * News Stress Score
+ 0.20 * Macro Stress Score
```

The score is research analytics only. It is not financial advice, investment
advice, or a trading recommendation.

## Country Universe

AtlasFX currently tracks 30 countries/regions that match the live Frankfurter
`/currencies` response. This keeps every visible non-USD FX metric on the same
exchange-rate source.

## FX Layer

Every monitored non-USD currency uses Frankfurter historical USD-based rates.

- 30-day depreciation is positive when the local currency weakens versus USD.
- 30-day volatility uses daily log returns annualized by `sqrt(252)`.
- If Frankfurter returns no observations for a request, AtlasFX uses a neutral
  no-data FX component for that response rather than inventing movement.

## News Layer

AtlasFX uses Google News RSS as the free/keyless primary headline source and
GDELT DOC as a backup. Queries are country/currency/economy focused and include
a 90-day RSS window.

Headlines are scored locally with a TF-IDF + logistic regression classifier
trained on seeded financial-stress language, blended with transparent crisis
theme matches. No LLM is required for the headline stress score.

## Macro Layer

Macro stress uses latest available World Bank indicators:

- Inflation: `FP.CPI.TOTL.ZG`
- GDP growth: `NY.GDP.MKTP.KD.ZG`
- Unemployment: `SL.UEM.TOTL.ZS`
- Current account balance: `BN.CAB.XOKA.GD.ZS`

Missing macro coverage receives a neutral no-data score.

## ML Classifiers

The baseline classifier suite trains scikit-learn logistic regression and
random forest models on historical Frankfurter FX windows. Training examples use
trailing FX features:

- 30-day depreciation
- 90-day depreciation
- 30-day annualized volatility
- 90-day annualized volatility
- Trend acceleration

Labels are derived from future 30-day depreciation buckets. Current classifier
metrics are baseline diagnostics, not production-grade crisis forecasts.

## NLP Evaluation

The headline stress classifier reports holdout accuracy, stress precision,
stress recall, stable precision, and stable recall on a curated finance-headline
holdout set. This keeps the local NLP layer auditable without requiring an LLM.

## Risk Labels

| Score Range | Label |
| ---: | --- |
| 0 to 20 | Stable |
| 21 to 40 | Watchlist |
| 41 to 60 | Stress |
| 61 to 80 | Storm |
| 81 to 100 | Crisis Risk |
