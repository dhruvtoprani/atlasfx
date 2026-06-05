# AtlasFX Dev Notes

This file tracks all implementation progress.

## Log Format

### YYYY-MM-DD HH:MM
- Files changed:
- What was implemented:
- What was fixed:
- Known issues:
- How to test:
- Notes for next agent/context:

### 2026-06-04 10:00
- Files changed: `README.md`, `DEV_NOTES.md`, `NEXT_STEPS.md`, `DECISIONS.md`, `.env.example`, `.gitignore`, `docs/*`
- What was implemented: Initialized the AtlasFX monorepo structure and developer continuity files.
- What was fixed: N/A
- Known issues: Frontend and backend are not scaffolded yet.
- How to test: N/A
- Notes for next agent/context: Continue with Next.js web app, FastAPI API, mock risk data, and FX scoring tests.

### 2026-06-04 10:17
- Files changed: `apps/web/*`, `apps/api/*`, `docs/*`, `data/samples/frankfurter_latest_usd.json`, `README.md`, `NEXT_STEPS.md`, `DECISIONS.md`
- What was implemented: Built the Next.js AtlasFX dashboard, country detail route, rankings table, replay route, model/about pages, FastAPI routers, mock risk service, FX client, scoring utilities, scripts, and scoring tests.
- What was fixed: Replaced the generated Next starter UI and fixed a TypeScript tuple inference issue in the model page.
- Known issues: Macro and news layers are mock MVP signals; `react-simple-maps` required `--legacy-peer-deps` with React 19; `npm audit` reports 7 dependency vulnerabilities.
- How to test: Run `.venv/bin/pytest`, `.venv/bin/ruff check .`, `npm run lint`, and `npm run build`.
- Notes for next agent/context: Replace mock risk rows with Frankfurter historical windows, then add real World Bank and GDELT ingestion.

### 2026-06-04 10:33
- Files changed: `apps/api/app/services/live_fx_risk.py`, `apps/api/app/routes/risk.py`, `apps/api/tests/test_live_fx_risk.py`, `apps/web/src/lib/api.ts`, `apps/web/src/components/dashboard-client.tsx`, `apps/web/src/components/rankings-table.tsx`, docs and continuity files.
- What was implemented: Added live Frankfurter historical FX scoring for supported currencies, API fallback to mock rows, frontend live API fetching with static fallback, and live data-source status in dashboard/rankings.
- What was fixed: Replaced static global dashboard/ranking data with API-backed data when the backend is available.
- Known issues: Country detail charts still use generated MVP series; macro/news layers remain mock; unsupported currencies stay mock until a source is chosen.
- How to test: Run `.venv/bin/pytest`, `.venv/bin/ruff check .`, `npm run lint`, `npm run build`, then open `http://127.0.0.1:3000`.
- Notes for next agent/context: Extend live FX history into `/api/risk/country/{code}` and country detail charts, then persist raw Frankfurter responses.

### 2026-06-04 14:20
- Files changed: `apps/api/app/services/live_fx_risk.py`, `apps/api/app/routes/risk.py`, `apps/api/app/routes/rankings.py`, `apps/api/tests/test_live_fx_risk.py`, `apps/web/src/lib/api.ts`, `apps/web/src/components/country-detail-client.tsx`, `apps/web/src/app/country/[code]/page.tsx`, docs and continuity files.
- What was implemented: Added live Frankfurter-backed country detail data, rolling FX depreciation/risk series, readable driver labels, live `/api/rankings`, and frontend country detail hydration with static fallback.
- What was fixed: Country detail no longer depends only on generated mock series for supported currencies.
- Known issues: Macro/news scores are still mock; replay and ML pages remain structured placeholders; unsupported currencies still use mock FX values.
- How to test: Run `.venv/bin/pytest`, `.venv/bin/ruff check .`, `npm run lint`, `npm run build`, then inspect `/country/JPN`.
- Notes for next agent/context: Persist fetched Frankfurter history to `data/raw` and start the World Bank macro ingestion layer.

### 2026-06-04 14:33
- Files changed: `apps/api/app/ml/news_sentiment.py`, `apps/api/app/services/news.py`, `apps/api/app/routes/news.py`, `apps/api/app/schemas/news.py`, `apps/api/app/services/live_fx_risk.py`, `apps/api/tests/test_news_sentiment.py`, `apps/web/src/types/atlas.ts`, `apps/web/src/lib/api.ts`, `apps/web/src/components/country-detail-client.tsx`, docs and continuity files.
- What was implemented: Added a GDELT DOC API country news service, throttled/cached GDELT requests, a local TF-IDF/logistic-regression NLP stress model, `/api/news/country/{code}`, live news signal integration for country detail risk, and a frontend news NLP panel.
- What was fixed: Country detail news stress can now be scored by AtlasFX's own local model instead of relying only on mock values.
- Known issues: GDELT rate limits aggressively; fallback remains available. Macro scores, replay data, and ML crisis classifier are still not live.
- How to test: Run `.venv/bin/pytest`, `.venv/bin/ruff check .`, `npm run lint`, `npm run build`, then inspect `/country/JPN` for the Local News NLP panel.
- Notes for next agent/context: Add persistent caching for GDELT responses, then replace macro mock scores using World Bank indicators.

### 2026-06-04 14:52
- Files changed: `apps/api/app/services/news.py`, `apps/api/app/services/macro.py`, `apps/api/app/services/live_fx_risk.py`, `apps/api/app/routes/news.py`, `apps/api/app/routes/macro.py`, `apps/api/app/schemas/macro.py`, `apps/api/app/schemas/risk.py`, `apps/api/scripts/fetch_news_signals.py`, `apps/api/scripts/fetch_macro_data.py`, `apps/web/src/app/page.tsx`, `apps/web/src/app/rankings/page.tsx`, `apps/web/src/app/country/[code]/page.tsx`, `apps/web/src/components/*`, `apps/web/src/lib/api.ts`, `apps/web/src/types/atlas.ts`, docs and continuity files.
- What was implemented: Switched news to Google News RSS primary with GDELT backup, added 90-day headline queries, added World Bank macro scoring, added `/api/news/global`, `/api/macro/global`, `/api/macro/country/{code}`, real macro/news panels, and server-seeded frontend pages to avoid mock-first rendering when the API is live.
- What was fixed: Removed mock macro/news from the live scoring path; unsupported FX now uses neutral no-data component scores instead of invented FX movement; top driver ignores neutral FX coverage gaps.
- Known issues: Replay timelines are still placeholders; the trained crisis classifier/SHAP layer is not built yet; Frankfurter still lacks ARS/EGP/NGN historical FX coverage.
- How to test: Run `.venv/bin/pytest`, `.venv/bin/ruff check .`, `npm run lint`, `npm run build`, then inspect `/country/ARG`.
- Notes for next agent/context: Add a clean second historical FX source for ARS/EGP/NGN or shrink the displayed FX universe; replace replay placeholders with real historical windows; train the baseline crisis classifier.

### 2026-06-04 15:20
- Files changed: `apps/api/app/ml/risk_classifier.py`, `apps/api/app/routes/model.py`, `apps/api/app/schemas/ml.py`, `apps/api/app/schemas/risk.py`, `apps/api/app/models/countries.py`, `apps/api/app/main.py`, `apps/api/scripts/train_model.py`, `apps/api/tests/test_risk_classifier.py`, `apps/web/src/app/model/page.tsx`, `apps/web/src/components/country-detail-client.tsx`, `apps/web/src/components/site-shell.tsx`, `apps/web/src/lib/api.ts`, `apps/web/src/lib/atlas-data.ts`, `apps/web/src/types/atlas.ts`, docs and README.
- What was implemented: Removed replay UI/API entirely, expanded the country universe to 32, added a Frankfurter-trained logistic regression FX regime classifier, exposed classifier metadata/prediction endpoints, and added ML diagnostics to country/model pages.
- What was fixed: The app no longer presents placeholder replay timelines as product scope; model page now reports actual trained classifier diagnostics.
- Known issues: Classifier crisis labels are rare and metrics are baseline-only; `ARS`, `EGP`, and `NGN` still need a second FX provider; generated `data/processed` outputs are intentionally gitignored.
- How to test: Run `.venv/bin/pytest`, `.venv/bin/ruff check .`, `npm run lint`, `npm run build`, then inspect `/model` and `/country/JPN`.
- Notes for next agent/context: Add SHAP explanations, source persistence, unsupported FX provider, and deployment/CI.

### 2026-06-04 15:45
- Files changed: `vercel.json`, `.github/workflows/ci.yml`, `apps/web/.npmrc`, `apps/web/src/lib/api.ts`, `apps/api/pyproject.toml`, `apps/api/requirements.txt`, `apps/api/app/ml/news_sentiment.py`, `apps/api/app/ml/risk_classifier.py`, `apps/api/app/schemas/ml.py`, `apps/web/src/app/model/page.tsx`, docs and README.
- What was implemented: Configured Vercel Services deployment, added GitHub Actions CI, slimmed backend runtime dependencies, added random-forest classifier comparison, and added NLP holdout evaluation metrics.
- What was fixed: Vercel install now handles React 19 peer dependency conflicts with `legacy-peer-deps`; model page now reports model comparison and NLP accuracy diagnostics.
- Known issues: Deployment is currently a Vercel preview URL; production promotion is pending explicit approval.
- How to test: Run `.venv/bin/pytest`, `.venv/bin/ruff check .`, `npm run lint`, `npm run build`, then inspect `/model`.
- Notes for next agent/context: Promote Vercel preview to production if requested; add SHAP/permutation explanations and chronological backtest next.

### 2026-06-04 16:10
- Files changed: `README.md`, `vercel.json`, `apps/web/src/lib/api.ts`
- What was implemented: Deployed the validated Vercel preview at `https://atlasfx-kau9l2q16-dhruv-kekin-topranis-projects.vercel.app` and updated the README preview link.
- What was fixed: Frontend API base URL now resolves `/server` to an absolute deployment URL during Vercel server rendering; API service budget is raised for ML cold starts.
- Known issues: Preview has not been promoted to production because production promotion was not explicitly requested.
- How to test: Local checks passed with `.venv/bin/pytest`, `.venv/bin/ruff check .`, `npm run lint`, and `npm run build`.
- Notes for next agent/context: If production is requested, run `vercel deploy --prod` after an in-browser smoke test of the preview.

### 2026-06-04 20:55
- Files changed: `apps/api/app/models/countries.py`, `apps/api/app/services/risk_builder.py`, `apps/api/app/services/live_fx_risk.py`, `apps/api/app/routes/*`, `apps/web/src/lib/atlas-data.ts`, `apps/web/src/components/*`, `README.md`, `docs/*`, `docs/assets/*`.
- What was implemented: Restricted AtlasFX to the 30 currencies currently returned by Frankfurter, added Iceland/ISK, removed unsupported FX countries, removed live API mock modes, refreshed GitHub screenshots, and added `docs/assets/atlasfx-demo.gif`.
- What was fixed: Frontend fallback now uses neutral no-data values rather than invented stress; server-seeded live data no longer displays API-offline status when a client refetch fails.
- Known issues: Production promotion is still pending explicit approval; chronological ML backtesting and raw source persistence remain next.
- How to test: `.venv/bin/pytest`, `.venv/bin/ruff check .`, `npm run lint`, and `npm run build` all pass.
- Notes for next agent/context: Final preview is `https://atlasfx-84zwjxszk-dhruv-kekin-topranis-projects.vercel.app`; if approved, promote with `vercel deploy --prod`.
