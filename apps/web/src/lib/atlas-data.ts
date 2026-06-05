import type { CountryMeta, CountryRiskDetail, CountryRiskRow, RiskLabel } from "@/types/atlas";

export const DISCLAIMER =
  "AtlasFX is a research and analytics project. It is not financial advice, investment advice, or a trading recommendation system.";

export const SCORE_WEIGHTS = {
  fxDepreciationScore: 0.35,
  fxVolatilityScore: 0.25,
  newsStressScore: 0.2,
  macroStressScore: 0.2,
};

const NEUTRAL_NEWS_SCORE = 50;
const NEUTRAL_MACRO_SCORE = 50;
const OFFLINE_DATA_QUALITY = "Live API unavailable; neutral no-data fallback";

const COUNTRY_META: CountryMeta[] = [
  { countryCode: "USA", countryName: "United States", currency: "USD", region: "North America", latitude: 38.9, longitude: -77.0 },
  { countryCode: "CAN", countryName: "Canada", currency: "CAD", region: "North America", latitude: 45.4, longitude: -75.7 },
  { countryCode: "MEX", countryName: "Mexico", currency: "MXN", region: "North America", latitude: 19.4, longitude: -99.1 },
  { countryCode: "GBR", countryName: "United Kingdom", currency: "GBP", region: "Europe", latitude: 51.5, longitude: -0.1 },
  { countryCode: "EUR", countryName: "Eurozone", currency: "EUR", region: "Europe", latitude: 50.9, longitude: 4.4 },
  { countryCode: "JPN", countryName: "Japan", currency: "JPY", region: "Asia", latitude: 35.7, longitude: 139.7 },
  { countryCode: "CHE", countryName: "Switzerland", currency: "CHF", region: "Europe", latitude: 46.9, longitude: 7.4 },
  { countryCode: "AUS", countryName: "Australia", currency: "AUD", region: "Oceania", latitude: -35.3, longitude: 149.1 },
  { countryCode: "TUR", countryName: "Turkey", currency: "TRY", region: "Europe/Asia", latitude: 39.9, longitude: 32.9 },
  { countryCode: "BRA", countryName: "Brazil", currency: "BRL", region: "South America", latitude: -15.8, longitude: -47.9 },
  { countryCode: "IND", countryName: "India", currency: "INR", region: "Asia", latitude: 28.6, longitude: 77.2 },
  { countryCode: "ZAF", countryName: "South Africa", currency: "ZAR", region: "Africa", latitude: -25.7, longitude: 28.2 },
  { countryCode: "THA", countryName: "Thailand", currency: "THB", region: "Asia", latitude: 13.8, longitude: 100.5 },
  { countryCode: "KOR", countryName: "South Korea", currency: "KRW", region: "Asia", latitude: 37.6, longitude: 126.9 },
  { countryCode: "IDN", countryName: "Indonesia", currency: "IDR", region: "Asia", latitude: -6.2, longitude: 106.8 },
  { countryCode: "CHN", countryName: "China", currency: "CNY", region: "Asia", latitude: 39.9, longitude: 116.4 },
  { countryCode: "POL", countryName: "Poland", currency: "PLN", region: "Europe", latitude: 52.2, longitude: 21.0 },
  { countryCode: "SWE", countryName: "Sweden", currency: "SEK", region: "Europe", latitude: 59.3, longitude: 18.1 },
  { countryCode: "NOR", countryName: "Norway", currency: "NOK", region: "Europe", latitude: 59.9, longitude: 10.8 },
  { countryCode: "ISL", countryName: "Iceland", currency: "ISK", region: "Europe", latitude: 64.1, longitude: -21.9 },
  { countryCode: "DNK", countryName: "Denmark", currency: "DKK", region: "Europe", latitude: 55.7, longitude: 12.6 },
  { countryCode: "NZL", countryName: "New Zealand", currency: "NZD", region: "Oceania", latitude: -41.3, longitude: 174.8 },
  { countryCode: "SGP", countryName: "Singapore", currency: "SGD", region: "Asia", latitude: 1.35, longitude: 103.82 },
  { countryCode: "HKG", countryName: "Hong Kong", currency: "HKD", region: "Asia", latitude: 22.3, longitude: 114.2 },
  { countryCode: "CZE", countryName: "Czechia", currency: "CZK", region: "Europe", latitude: 50.1, longitude: 14.4 },
  { countryCode: "HUN", countryName: "Hungary", currency: "HUF", region: "Europe", latitude: 47.5, longitude: 19.0 },
  { countryCode: "ISR", countryName: "Israel", currency: "ILS", region: "Middle East", latitude: 31.8, longitude: 35.2 },
  { countryCode: "MYS", countryName: "Malaysia", currency: "MYR", region: "Asia", latitude: 3.1, longitude: 101.7 },
  { countryCode: "PHL", countryName: "Philippines", currency: "PHP", region: "Asia", latitude: 14.6, longitude: 121.0 },
  { countryCode: "ROU", countryName: "Romania", currency: "RON", region: "Europe", latitude: 44.4, longitude: 26.1 },
];

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function riskLabel(score: number): RiskLabel {
  if (score <= 20) return "Stable";
  if (score <= 40) return "Watchlist";
  if (score <= 60) return "Stress";
  if (score <= 80) return "Storm";
  return "Crisis Risk";
}

function offlineRiskScore() {
  return Number(
    (
      SCORE_WEIGHTS.newsStressScore * NEUTRAL_NEWS_SCORE +
      SCORE_WEIGHTS.macroStressScore * NEUTRAL_MACRO_SCORE
    ).toFixed(1),
  );
}

function scoreCountry(country: CountryMeta): CountryRiskRow {
  const riskScore = offlineRiskScore();

  return {
    ...country,
    riskScore,
    riskLabel: riskLabel(riskScore),
    fx30dDepreciation: 0,
    fxVolatility30d: 0,
    newsStressScore: NEUTRAL_NEWS_SCORE,
    macroStressScore: NEUTRAL_MACRO_SCORE,
    topDriver: "No live source loaded",
    dataQuality: OFFLINE_DATA_QUALITY,
  };
}

export const countryRiskRows = COUNTRY_META.map(scoreCountry).sort((a, b) => b.riskScore - a.riskScore);

export const regions = ["All", ...Array.from(new Set(countryRiskRows.map((country) => country.region))).sort()];

export function getCountryDetail(code: string): CountryRiskDetail | undefined {
  const row = countryRiskRows.find((country) => country.countryCode === code.toUpperCase());
  if (!row) return undefined;

  const date = new Date("2026-06-04T12:00:00").toISOString().slice(0, 10);
  const breakdown = {
    fxDepreciationScore: 0,
    fxVolatilityScore: 0,
    newsStressScore: NEUTRAL_NEWS_SCORE,
    macroStressScore: NEUTRAL_MACRO_SCORE,
  };

  return {
    ...row,
    summary: `${row.countryName} could not load live API data. AtlasFX is showing neutral no-data values rather than invented currency stress.`,
    series: {
      fx: [],
      riskScore: [{ date, value: row.riskScore }],
      newsSentiment: [{ date, value: NEUTRAL_NEWS_SCORE }],
    },
    breakdown,
    drivers: [
      { feature: "News stress", impact: clamp(NEUTRAL_NEWS_SCORE) / 100 },
      { feature: "Macro stress", impact: clamp(NEUTRAL_MACRO_SCORE) / 100 },
      { feature: "FX depreciation", impact: 0 },
      { feature: "FX volatility", impact: 0 },
    ],
  };
}

export function globalRiskMode() {
  const average = countryRiskRows.reduce((total, country) => total + country.riskScore, 0) / countryRiskRows.length;
  if (average > 60) return "Storm";
  if (average > 40) return "Elevated";
  if (average > 25) return "Watchlist";
  return "Calm";
}
