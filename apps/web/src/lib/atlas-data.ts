import type { CountryMeta, CountryRiskDetail, CountryRiskRow, RiskLabel } from "@/types/atlas";

export const DISCLAIMER =
  "AtlasFX is a research and analytics project. It is not financial advice, investment advice, or a trading recommendation system.";

export const SCORE_WEIGHTS = {
  fxDepreciationScore: 0.35,
  fxVolatilityScore: 0.25,
  newsStressScore: 0.2,
  macroStressScore: 0.2,
};

const COUNTRY_META: CountryMeta[] = [
  { countryCode: "USA", countryName: "United States", currency: "USD", region: "North America", latitude: 38.9, longitude: -77.0, frankfurterSupported: true },
  { countryCode: "CAN", countryName: "Canada", currency: "CAD", region: "North America", latitude: 45.4, longitude: -75.7, frankfurterSupported: true },
  { countryCode: "MEX", countryName: "Mexico", currency: "MXN", region: "North America", latitude: 19.4, longitude: -99.1, frankfurterSupported: true },
  { countryCode: "GBR", countryName: "United Kingdom", currency: "GBP", region: "Europe", latitude: 51.5, longitude: -0.1, frankfurterSupported: true },
  { countryCode: "EUR", countryName: "Eurozone", currency: "EUR", region: "Europe", latitude: 50.9, longitude: 4.4, frankfurterSupported: true },
  { countryCode: "JPN", countryName: "Japan", currency: "JPY", region: "Asia", latitude: 35.7, longitude: 139.7, frankfurterSupported: true },
  { countryCode: "CHE", countryName: "Switzerland", currency: "CHF", region: "Europe", latitude: 46.9, longitude: 7.4, frankfurterSupported: true },
  { countryCode: "AUS", countryName: "Australia", currency: "AUD", region: "Oceania", latitude: -35.3, longitude: 149.1, frankfurterSupported: true },
  { countryCode: "TUR", countryName: "Turkey", currency: "TRY", region: "Europe/Asia", latitude: 39.9, longitude: 32.9, frankfurterSupported: true },
  { countryCode: "BRA", countryName: "Brazil", currency: "BRL", region: "South America", latitude: -15.8, longitude: -47.9, frankfurterSupported: true },
  { countryCode: "IND", countryName: "India", currency: "INR", region: "Asia", latitude: 28.6, longitude: 77.2, frankfurterSupported: true },
  { countryCode: "ZAF", countryName: "South Africa", currency: "ZAR", region: "Africa", latitude: -25.7, longitude: 28.2, frankfurterSupported: true },
  { countryCode: "EGY", countryName: "Egypt", currency: "EGP", region: "Africa", latitude: 30.0, longitude: 31.2, frankfurterSupported: false },
  { countryCode: "NGA", countryName: "Nigeria", currency: "NGN", region: "Africa", latitude: 9.1, longitude: 7.5, frankfurterSupported: false },
  { countryCode: "THA", countryName: "Thailand", currency: "THB", region: "Asia", latitude: 13.8, longitude: 100.5, frankfurterSupported: true },
  { countryCode: "KOR", countryName: "South Korea", currency: "KRW", region: "Asia", latitude: 37.6, longitude: 126.9, frankfurterSupported: true },
  { countryCode: "IDN", countryName: "Indonesia", currency: "IDR", region: "Asia", latitude: -6.2, longitude: 106.8, frankfurterSupported: true },
  { countryCode: "CHN", countryName: "China", currency: "CNY", region: "Asia", latitude: 39.9, longitude: 116.4, frankfurterSupported: true },
  { countryCode: "ARG", countryName: "Argentina", currency: "ARS", region: "South America", latitude: -34.6, longitude: -58.4, frankfurterSupported: false },
  { countryCode: "POL", countryName: "Poland", currency: "PLN", region: "Europe", latitude: 52.2, longitude: 21.0, frankfurterSupported: true },
  { countryCode: "SWE", countryName: "Sweden", currency: "SEK", region: "Europe", latitude: 59.3, longitude: 18.1, frankfurterSupported: true },
  { countryCode: "NOR", countryName: "Norway", currency: "NOK", region: "Europe", latitude: 59.9, longitude: 10.8, frankfurterSupported: true },
  { countryCode: "DNK", countryName: "Denmark", currency: "DKK", region: "Europe", latitude: 55.7, longitude: 12.6, frankfurterSupported: true },
  { countryCode: "NZL", countryName: "New Zealand", currency: "NZD", region: "Oceania", latitude: -41.3, longitude: 174.8, frankfurterSupported: true },
  { countryCode: "SGP", countryName: "Singapore", currency: "SGD", region: "Asia", latitude: 1.35, longitude: 103.82, frankfurterSupported: true },
  { countryCode: "HKG", countryName: "Hong Kong", currency: "HKD", region: "Asia", latitude: 22.3, longitude: 114.2, frankfurterSupported: true },
  { countryCode: "CZE", countryName: "Czechia", currency: "CZK", region: "Europe", latitude: 50.1, longitude: 14.4, frankfurterSupported: true },
  { countryCode: "HUN", countryName: "Hungary", currency: "HUF", region: "Europe", latitude: 47.5, longitude: 19.0, frankfurterSupported: true },
  { countryCode: "ISR", countryName: "Israel", currency: "ILS", region: "Middle East", latitude: 31.8, longitude: 35.2, frankfurterSupported: true },
  { countryCode: "MYS", countryName: "Malaysia", currency: "MYR", region: "Asia", latitude: 3.1, longitude: 101.7, frankfurterSupported: true },
  { countryCode: "PHL", countryName: "Philippines", currency: "PHP", region: "Asia", latitude: 14.6, longitude: 121.0, frankfurterSupported: true },
  { countryCode: "ROU", countryName: "Romania", currency: "RON", region: "Europe", latitude: 44.4, longitude: 26.1, frankfurterSupported: true },
];

const SIGNALS: Record<string, { depreciation: number; volatility: number; news: number; macro: number }> = {
  USD: { depreciation: 0.0, volatility: 4.2, news: 28, macro: 25 },
  CAD: { depreciation: 1.2, volatility: 7.1, news: 31, macro: 29 },
  MXN: { depreciation: 4.7, volatility: 13.4, news: 47, macro: 44 },
  GBP: { depreciation: 2.1, volatility: 9.8, news: 38, macro: 33 },
  EUR: { depreciation: 1.8, volatility: 8.5, news: 35, macro: 31 },
  JPY: { depreciation: 7.6, volatility: 16.8, news: 58, macro: 42 },
  CHF: { depreciation: -0.8, volatility: 6.2, news: 22, macro: 18 },
  AUD: { depreciation: 3.5, volatility: 11.9, news: 34, macro: 37 },
  TRY: { depreciation: 13.9, volatility: 28.5, news: 72, macro: 86 },
  BRL: { depreciation: 6.4, volatility: 19.2, news: 51, macro: 55 },
  INR: { depreciation: 2.8, volatility: 8.8, news: 42, macro: 39 },
  ZAR: { depreciation: 8.5, volatility: 23.4, news: 62, macro: 59 },
  EGP: { depreciation: 10.6, volatility: 25.1, news: 67, macro: 78 },
  NGN: { depreciation: 15.4, volatility: 33.7, news: 76, macro: 88 },
  THB: { depreciation: 2.5, volatility: 9.2, news: 30, macro: 35 },
  KRW: { depreciation: 4.1, volatility: 12.6, news: 44, macro: 36 },
  IDR: { depreciation: 5.6, volatility: 14.7, news: 49, macro: 46 },
  CNY: { depreciation: 3.2, volatility: 7.9, news: 46, macro: 43 },
  ARS: { depreciation: 18.2, volatility: 38.6, news: 81, macro: 92 },
  PLN: { depreciation: 2.9, volatility: 10.4, news: 33, macro: 34 },
  SEK: { depreciation: 1.4, volatility: 8.1, news: 30, macro: 22 },
  NOK: { depreciation: 1.9, volatility: 9.4, news: 31, macro: 21 },
  DKK: { depreciation: 0.8, volatility: 6.8, news: 24, macro: 18 },
  NZD: { depreciation: 2.6, volatility: 10.8, news: 32, macro: 27 },
  SGD: { depreciation: 0.5, volatility: 5.8, news: 25, macro: 19 },
  HKD: { depreciation: 0.2, volatility: 3.2, news: 29, macro: 26 },
  CZK: { depreciation: 2.4, volatility: 9.7, news: 32, macro: 30 },
  HUF: { depreciation: 3.8, volatility: 13.8, news: 39, macro: 41 },
  ILS: { depreciation: 4.4, volatility: 15.1, news: 45, macro: 36 },
  MYR: { depreciation: 2.7, volatility: 8.9, news: 34, macro: 31 },
  PHP: { depreciation: 3.1, volatility: 10.2, news: 36, macro: 33 },
  RON: { depreciation: 1.7, volatility: 7.6, news: 29, macro: 29 },
};

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

function fxDepreciationScore(depreciation: number) {
  return clamp((depreciation / 15) * 100);
}

function fxVolatilityScore(volatility: number) {
  return clamp((volatility / 30) * 100);
}

function scoreCountry(country: CountryMeta): CountryRiskRow {
  const signal = SIGNALS[country.currency];
  const breakdown = {
    fxDepreciationScore: fxDepreciationScore(signal.depreciation),
    fxVolatilityScore: fxVolatilityScore(signal.volatility),
    newsStressScore: signal.news,
    macroStressScore: signal.macro,
  };
  const riskScore = Number(
    (
      SCORE_WEIGHTS.fxDepreciationScore * breakdown.fxDepreciationScore +
      SCORE_WEIGHTS.fxVolatilityScore * breakdown.fxVolatilityScore +
      SCORE_WEIGHTS.newsStressScore * breakdown.newsStressScore +
      SCORE_WEIGHTS.macroStressScore * breakdown.macroStressScore
    ).toFixed(1),
  );
  const weightedDrivers = [
    ["FX depreciation", SCORE_WEIGHTS.fxDepreciationScore * breakdown.fxDepreciationScore],
    ["FX volatility", SCORE_WEIGHTS.fxVolatilityScore * breakdown.fxVolatilityScore],
    ["News stress", SCORE_WEIGHTS.newsStressScore * breakdown.newsStressScore],
    ["Macro stress", SCORE_WEIGHTS.macroStressScore * breakdown.macroStressScore],
  ] as const;
  const topDriver = [...weightedDrivers].sort((a, b) => b[1] - a[1])[0][0];

  return {
    ...country,
    riskScore,
    riskLabel: riskLabel(riskScore),
    fx30dDepreciation: signal.depreciation,
    fxVolatility30d: signal.volatility,
    newsStressScore: signal.news,
    macroStressScore: signal.macro,
    topDriver,
    dataQuality: country.frankfurterSupported ? "Static fallback; API offline" : "Static fallback; source support gap",
  };
}

export const countryRiskRows = COUNTRY_META.map(scoreCountry).sort((a, b) => b.riskScore - a.riskScore);

export const regions = ["All", ...Array.from(new Set(countryRiskRows.map((country) => country.region))).sort()];

export function getCountryDetail(code: string): CountryRiskDetail | undefined {
  const row = countryRiskRows.find((country) => country.countryCode === code.toUpperCase());
  if (!row) return undefined;

  const signal = SIGNALS[row.currency];
  const today = new Date("2026-06-04T12:00:00");
  const fx = Array.from({ length: 31 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (30 - index));
    const progress = index / 30;
    return {
      date: date.toISOString().slice(5, 10),
      value: Number((progress * signal.depreciation + Math.sin(progress * Math.PI * 2) * 0.8).toFixed(2)),
    };
  });
  const riskScore = fx.map((point, index) => ({
    date: point.date,
    value: Number((row.riskScore * (0.72 + (index / 30) * 0.28)).toFixed(1)),
  }));
  const newsSentiment = fx.map((point, index) => ({
    date: point.date,
    value: Number((signal.news * (0.82 + (index / 30) * 0.18)).toFixed(1)),
  }));
  const breakdown = {
    fxDepreciationScore: fxDepreciationScore(signal.depreciation),
    fxVolatilityScore: fxVolatilityScore(signal.volatility),
    newsStressScore: signal.news,
    macroStressScore: signal.macro,
  };
  const driverLabels: Record<keyof typeof breakdown, string> = {
    fxDepreciationScore: "FX depreciation",
    fxVolatilityScore: "FX volatility",
    newsStressScore: "News stress",
    macroStressScore: "Macro stress",
  };

  return {
    ...row,
    summary: `${row.countryName} is in ${row.riskLabel.toLowerCase()} territory in the static offline fallback. Run the API for live FX, RSS NLP news, World Bank macro, and ML classification.`,
    series: { fx, riskScore, newsSentiment },
    breakdown,
    drivers: Object.entries(breakdown)
      .map(([feature, value]) => ({
        feature: driverLabels[feature as keyof typeof breakdown],
        impact: Number((value / 100).toFixed(2)),
      }))
      .sort((a, b) => b.impact - a.impact),
  };
}

export function globalRiskMode() {
  const average = countryRiskRows.reduce((total, country) => total + country.riskScore, 0) / countryRiskRows.length;
  if (average > 60) return "Storm";
  if (average > 40) return "Elevated";
  if (average > 25) return "Watchlist";
  return "Calm";
}
