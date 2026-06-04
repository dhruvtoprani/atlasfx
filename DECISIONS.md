# AtlasFX Technical Decisions

This file records major product and engineering decisions.

## Decision Format

### YYYY-MM-DD: Decision Title

**Decision:**  
**Why:**  
**Alternatives considered:**  
**Tradeoffs:**  
**Status:** Accepted / Rejected / Revisit later

### 2026-06-04: MVP uses rule-based scoring first

**Decision:** AtlasFX starts with the weighted rule-based stress score from the PRD before adding ML.  
**Why:** The product needs an explainable, working baseline before model complexity.  
**Alternatives considered:** Training a classifier immediately.  
**Tradeoffs:** Faster MVP and clearer explanations, but mock macro/news layers remain placeholders.  
**Status:** Accepted

### 2026-06-04: Mock macro and news layers stay visible

**Decision:** Macro and news stress are included as labeled mock scores in the first UI/API pass.  
**Why:** The dashboard needs the full explainability shape before World Bank and GDELT ingestion are complete.  
**Alternatives considered:** Hiding macro/news until integrations are real.  
**Tradeoffs:** Better product completeness, but users must see the mock-data warning.  
**Status:** Accepted

### 2026-06-04: React Simple Maps installed with legacy peer resolution

**Decision:** Keep `react-simple-maps` in the web app using `npm install --legacy-peer-deps`.  
**Why:** The PRD requested React Simple Maps, but the package peer range has not caught up with React 19.  
**Alternatives considered:** Hand-building a map mockup without the library.  
**Tradeoffs:** Closer to the target stack, but dependency audits need follow-up.  
**Status:** Revisit later

### 2026-06-04: Live FX rows with static fallback

**Decision:** Global risk and rankings fetch live Frankfurter FX metrics from FastAPI and fall back to static mock rows when the API is offline.  
**Why:** The MVP should keep working during local development while still showing real FX movement whenever the backend is available.  
**Alternatives considered:** Blocking the UI on live API data or keeping the UI fully static.  
**Tradeoffs:** Better resilience, but country detail pages need a second pass to use live series.  
**Status:** Accepted

### 2026-06-04: Country detail hydrates from API

**Decision:** Country pages render a static fallback first and then hydrate from `/api/risk/country/{code}` with live FX series where available.  
**Why:** This keeps dynamic pages resilient while showing live country-level FX movement once the backend responds.  
**Alternatives considered:** Server-side fetching only or fully static detail pages.  
**Tradeoffs:** Slightly more client-side complexity, but stronger local-development resilience.  
**Status:** Accepted

### 2026-06-04: Local NLP for news stress

**Decision:** AtlasFX uses GDELT headlines plus a local TF-IDF/logistic-regression model with crisis-theme lexicon features for news stress.  
**Why:** The product needs an explainable non-LLM NLP layer that can score headlines without sending text to a language model.  
**Alternatives considered:** LLM summarization, GDELT tone only, or continuing with static mock news scores.  
**Tradeoffs:** Fast and transparent, but less nuanced than a large pretrained language model and dependent on headline quality.  
**Status:** Accepted

### 2026-06-04: RSS news primary with GDELT backup

**Decision:** Use Google News RSS as the primary free/keyless news source and keep GDELT as a backup provider.  
**Why:** GDELT rate limits were slowing development, while RSS is clean enough for a portfolio research prototype that does not need minute-level updates.  
**Alternatives considered:** NewsAPI, Mediastack, paid Event Registry/newsapi.ai, or GDELT-only ingestion.  
**Tradeoffs:** RSS is free and simple, but it is less formally productized than a paid licensed news API.  
**Status:** Accepted

### 2026-06-04: Neutral no-data scores replace live-path mocks

**Decision:** When a source lacks coverage, AtlasFX uses neutral no-data component scores and labels the source gap instead of inventing mock movement or stress.  
**Why:** The live product should not pretend unavailable data is real analysis.  
**Alternatives considered:** Keeping mock values, excluding unsupported countries, or blocking the score until every source is available.  
**Tradeoffs:** Scores remain comparable across the MVP universe, but unsupported FX can still influence totals through neutral baselines.  
**Status:** Accepted

### 2026-06-04: Remove replay scope

**Decision:** Remove replay routes, UI, API endpoints, and static replay datasets.  
**Why:** Placeholder timelines weakened the portfolio narrative; the product is stronger when every visible feature is backed by real data or clearly unavailable source coverage.  
**Alternatives considered:** Keeping replay as a planned page or rebuilding replay with historical windows immediately.  
**Tradeoffs:** Smaller scope, but a cleaner and more defensible product.  
**Status:** Accepted

### 2026-06-04: Add baseline FX regime classifier

**Decision:** Add a scikit-learn logistic regression classifier trained on historical Frankfurter FX feature windows.  
**Why:** The project needs a real ML component that is inspectable, fast to train, and honest about class imbalance before moving to tree models or SHAP.  
**Alternatives considered:** XGBoost first, LLM-based classification, or keeping only the rule-based score.  
**Tradeoffs:** Transparent and lightweight, but baseline metrics are limited by rare crisis labels and FX-only features.  
**Status:** Accepted

### 2026-06-04: Expand to 32 countries

**Decision:** Add 12 more countries/regions where Frankfurter has supported currencies and World Bank coverage is clean.  
**Why:** A broader map improves the portfolio demo without introducing unsupported FX data quality problems.  
**Alternatives considered:** Staying at 20 countries or adding all requested macro countries regardless of FX coverage.  
**Tradeoffs:** Better product breadth, while `ARS`, `EGP`, and `NGN` still need a separate FX provider.  
**Status:** Accepted
