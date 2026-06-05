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
**Tradeoffs:** Faster MVP and clearer explanations, with source layers added incrementally.
**Status:** Accepted

### 2026-06-04: Macro and news placeholders define the first UI shape

**Decision:** Macro and news stress are represented in the first UI/API pass while source integrations are being built.
**Why:** The dashboard needs the full explainability shape before World Bank and news ingestion are complete.
**Alternatives considered:** Hiding macro/news until integrations are real.  
**Tradeoffs:** Better product completeness, but source status has to be explicit.
**Status:** Accepted

### 2026-06-04: React Simple Maps installed with legacy peer resolution

**Decision:** Keep `react-simple-maps` in the web app using `npm install --legacy-peer-deps`.  
**Why:** The PRD requested React Simple Maps, but the package peer range has not caught up with React 19.  
**Alternatives considered:** Hand-building a map prototype without the library.
**Tradeoffs:** Closer to the target stack, but dependency audits need follow-up.  
**Status:** Revisit later

### 2026-06-04: Live FX rows with neutral fallback

**Decision:** Global risk and rankings fetch live Frankfurter FX metrics from FastAPI and fall back to neutral no-data rows when the API is offline.
**Why:** The MVP should keep working during local development while still showing real FX movement whenever the backend is available.  
**Alternatives considered:** Blocking the UI on live API data or keeping the UI fully static.  
**Tradeoffs:** Better resilience, but country detail pages need a second pass to use live series.  
**Status:** Accepted

### 2026-06-04: Country detail hydrates from API

**Decision:** Country pages render neutral no-data fallback values first and then hydrate from `/api/risk/country/{code}` with live FX series.
**Why:** This keeps dynamic pages resilient while showing live country-level FX movement once the backend responds.  
**Alternatives considered:** Server-side fetching only or fully static detail pages.  
**Tradeoffs:** Slightly more client-side complexity, but stronger local-development resilience.  
**Status:** Accepted

### 2026-06-04: Local NLP for news stress

**Decision:** AtlasFX uses GDELT headlines plus a local TF-IDF/logistic-regression model with crisis-theme lexicon features for news stress.  
**Why:** The product needs an explainable non-LLM NLP layer that can score headlines without sending text to a language model.  
**Alternatives considered:** LLM summarization, GDELT tone only, or continuing with static placeholder news scores.
**Tradeoffs:** Fast and transparent, but less nuanced than a large pretrained language model and dependent on headline quality.  
**Status:** Accepted

### 2026-06-04: RSS news primary with GDELT backup

**Decision:** Use Google News RSS as the primary free/keyless news source and keep GDELT as a backup provider.  
**Why:** GDELT rate limits were slowing development, while RSS is clean enough for a portfolio research prototype that does not need minute-level updates.  
**Alternatives considered:** NewsAPI, Mediastack, paid Event Registry/newsapi.ai, or GDELT-only ingestion.  
**Tradeoffs:** RSS is free and simple, but it is less formally productized than a paid licensed news API.  
**Status:** Accepted

### 2026-06-04: Neutral no-data scores replace live-path placeholders

**Decision:** When a source lacks coverage, AtlasFX uses neutral no-data component scores and labels the source gap instead of inventing movement or stress.
**Why:** The live product should not pretend unavailable data is real analysis.  
**Alternatives considered:** Keeping synthetic values, excluding affected countries, or blocking the score until every source is available.
**Tradeoffs:** Scores remain comparable across the universe, but source quality has to be visible.
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

### 2026-06-04: Expand country coverage

**Decision:** Add more countries/regions where Frankfurter and World Bank coverage are clean.
**Why:** A broader map improves the portfolio demo while preserving source quality.
**Alternatives considered:** Staying at 20 countries or adding all requested macro countries regardless of FX coverage.  
**Tradeoffs:** Better product breadth, with final public scope constrained by live FX availability.
**Status:** Accepted

### 2026-06-04: Deploy with Vercel Services

**Decision:** Deploy AtlasFX as a Vercel Services project with Next.js at `/` and FastAPI mounted under `/server`.
**Why:** This keeps the public demo to one URL while preserving a real Python backend.
**Alternatives considered:** Vercel frontend plus Render/Railway backend, or frontend-only static deployment.
**Tradeoffs:** Services is newer Vercel infrastructure, but it simplifies portfolio sharing and avoids CORS complexity.
**Status:** Accepted

### 2026-06-04: Compare ML baselines before SHAP

**Decision:** Compare logistic regression and random forest baselines before adding heavier explainability tools.
**Why:** Model comparison is a more defensible next step than adding SHAP to an unvalidated model.
**Alternatives considered:** XGBoost/SHAP immediately.
**Tradeoffs:** Less flashy than gradient boosting, but faster to deploy and easier to interpret under class imbalance.
**Status:** Accepted

### 2026-06-04: Track only current Frankfurter currencies

**Decision:** Limit the public AtlasFX universe to the 30 currencies currently returned by Frankfurter `/currencies`, represented as countries/regions in the dashboard.
**Why:** A portfolio demo is stronger when every visible FX metric can be backed by the same live exchange-rate source.
**Alternatives considered:** Keeping Argentina, Egypt, and Nigeria with neutral FX gaps, or adding a second FX provider immediately.
**Tradeoffs:** Smaller visible universe, but cleaner source integrity and no unsupported-currency caveats in the UI.
**Status:** Accepted

### 2026-06-05: Gate rendering on connector readiness

**Decision:** AtlasFX shows a full-screen boot gate until required API connectors, the global risk payload, and route-specific payloads are loaded.
**Why:** The portfolio demo should not flash partial, fallback, or stale states before live data readiness is established.
**Alternatives considered:** Letting each page show independent loading states or rendering cached fallback data first.
**Tradeoffs:** First paint can be slower when external sources are cold, but the visible product is more consistent and source-honest.
**Status:** Accepted
