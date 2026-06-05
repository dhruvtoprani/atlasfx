# AtlasFX Next Steps

This file tracks unfinished work so progress can continue after context truncation.

## Immediate
- [x] Scaffold monorepo
- [x] Create frontend app
- [x] Create FastAPI backend
- [x] Test Frankfurter API
- [x] Fetch sample FX data
- [x] Build first stress score calculation
- [x] Render money weather map
- [x] Render rankings table

## Next
- [x] Add country detail page
- [x] Add initial macro data layer
- [x] Add initial news stress layer
- [x] Add model methodology page
- [x] Replace synthetic FX rows with live Frankfurter history
- [x] Use live FX series on country detail pages
- [x] Make backend rankings endpoint live
- [x] Add GDELT country news endpoint
- [x] Add local non-LLM news sentiment model
- [x] Show news NLP signal on country detail pages
- [x] Add Google News RSS as clean/free primary news source
- [x] Add World Bank macro scoring
- [x] Replace live scoring macro/news placeholders with real signals
- [x] Align country universe to current Frankfurter `/currencies`
- [x] Add logistic-regression FX regime classifier
- [x] Add random-forest classifier comparison
- [x] Add local NLP holdout evaluation
- [x] Remove replay routes and UI
- [x] Pull country news and macro snapshots into `data/processed`
- [x] Remove unsupported FX countries from API and UI
- [x] Remove visible synthetic stress fallback paths
- [x] Add GitHub demo GIF/video assets
- [x] Configure Vercel Services deployment
- [x] Deploy Vercel preview
- [x] Add GitHub Actions CI
- [ ] Persist fetched FX data under `data/raw`
- [ ] Persist fetched RSS/GDELT data under `data/raw`
- [ ] Add API integration tests
- [ ] Add browser visual regression screenshots in CI

## Up Next
- [ ] Persist Frankfurter historical responses
- [ ] Persist RSS/GDELT article responses and sentiment outputs
- [ ] Add live country detail API integration tests
- [ ] Add chronological backtest report for the ML classifier
- [ ] Promote Vercel preview to production after final smoke test

## Later
- [ ] Add SHAP explanations
- [ ] Add scenario simulator
- [ ] Add alternative data layers such as flights or shipping

## Blocked
- `react-simple-maps` has an older React peer range; installed with `--legacy-peer-deps` for the MVP.
