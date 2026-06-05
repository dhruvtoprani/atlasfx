import { countryRiskRows, globalRiskMode } from "@/lib/atlas-data";
import type {
  CountryRiskDetail,
  CountryRiskRow,
  MacroIndicator,
  MacroSignal,
  MlFeatureImportance,
  MlMetricReport,
  MlModelInfo,
  MlSignal,
  NlpEvaluationReport,
  NewsArticle,
  NewsSignal,
  SeriesPoint,
} from "@/types/atlas";

function getApiBaseUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_ATLASFX_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    (process.env.VERCEL_URL ? "/server" : undefined);

  if (configuredUrl?.startsWith("/") && typeof window === "undefined" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}${configuredUrl}`;
  }

  return configuredUrl ?? "http://127.0.0.1:8000";
}

type ApiCountryRiskRow = {
  country_code: string;
  country_name: string;
  currency: string;
  region: string;
  risk_score: number;
  risk_label: CountryRiskRow["riskLabel"];
  fx_30d_depreciation: number;
  fx_volatility_30d: number;
  news_stress_score: number;
  macro_stress_score: number;
  top_driver: string;
  data_quality: string;
};

type ApiGlobalRiskResponse = {
  as_of: string;
  global_risk_mode: string;
  data_source: string;
  countries: ApiCountryRiskRow[];
};

type ApiCountryRiskDetail = ApiCountryRiskRow & {
  summary: string;
  series: {
    fx: SeriesPoint[];
    risk_score: SeriesPoint[];
    news_sentiment: SeriesPoint[];
  };
  breakdown: {
    fx_depreciation_score: number;
    fx_volatility_score: number;
    news_stress_score: number;
    macro_stress_score: number;
  };
  drivers: {
    feature: string;
    impact: number;
  }[];
  news_signal?: ApiNewsSignal | null;
  macro_signal?: ApiMacroSignal | null;
  ml_signal?: ApiMlSignal | null;
};

type ApiNewsArticle = {
  title: string;
  url: string;
  domain?: string | null;
  language?: string | null;
  source_country?: string | null;
  seen_at?: string | null;
  sentiment_score: number;
  stress_probability: number;
  theme_hits: string[];
};

type ApiNewsSignal = {
  country_code: string;
  country_name: string;
  currency: string;
  as_of: string;
  source: string;
  query: string;
  article_count: number;
  news_stress_score: number;
  average_sentiment: number;
  negative_article_share: number;
  crisis_theme_share: number;
  articles: ApiNewsArticle[];
};

type ApiMacroIndicator = {
  name: string;
  indicator_code: string;
  value: number | null;
  year: number | null;
  stress_score: number;
  description: string;
};

type ApiMacroSignal = {
  country_code: string;
  country_name: string;
  currency: string;
  as_of: string;
  source: string;
  macro_stress_score: number;
  indicators: ApiMacroIndicator[];
};

type ApiMlFeatureImportance = {
  feature: string;
  importance: number;
};

type ApiMlMetricReport = {
  accuracy: number | null;
  macro_f1: number | null;
  crisis_precision: number | null;
  crisis_recall: number | null;
  training_examples: number;
  test_examples: number;
  class_distribution: Record<string, number>;
};

type ApiMlModelInfo = {
  model_type: string;
  status: string;
  selected_model: string | null;
  source: string;
  labels: string[];
  features: string[];
  metrics: ApiMlMetricReport | null;
  model_comparison: Record<string, ApiMlMetricReport>;
  feature_importance: ApiMlFeatureImportance[];
  nlp_evaluation: ApiNlpEvaluationReport | null;
  limitations: string[];
};

type ApiNlpEvaluationReport = {
  model_type: string;
  holdout_examples: number;
  accuracy: number;
  stress_precision: number;
  stress_recall: number;
  stable_precision: number;
  stable_recall: number;
};

type ApiMlSignal = {
  country_code: string;
  country_name: string;
  currency: string;
  status: string;
  model_type: string;
  predicted_label: string | null;
  crisis_probability: number | null;
  class_probabilities: Record<string, number>;
  features: Record<string, number>;
  top_features: ApiMlFeatureImportance[];
  training_examples: number | null;
  source: string;
};

export type GlobalRiskData = {
  asOf: string;
  globalRiskMode: string;
  dataSource: string;
  countries: CountryRiskRow[];
};

export const fallbackGlobalRiskData: GlobalRiskData = {
  asOf: "no-live-api",
  globalRiskMode: globalRiskMode(),
  dataSource: "Live API unavailable; neutral no-data fallback",
  countries: countryRiskRows,
};

function toCountryRiskRow(row: ApiCountryRiskRow): CountryRiskRow {
  const fallback = countryRiskRows.find((country) => country.countryCode === row.country_code);

  return {
    countryCode: row.country_code,
    countryName: row.country_name,
    currency: row.currency,
    region: row.region,
    latitude: fallback?.latitude ?? 0,
    longitude: fallback?.longitude ?? 0,
    riskScore: row.risk_score,
    riskLabel: row.risk_label,
    fx30dDepreciation: row.fx_30d_depreciation,
    fxVolatility30d: row.fx_volatility_30d,
    newsStressScore: row.news_stress_score,
    macroStressScore: row.macro_stress_score,
    topDriver: row.top_driver,
    dataQuality: row.data_quality,
  };
}

function toCountryRiskDetail(row: ApiCountryRiskDetail): CountryRiskDetail {
  return {
    ...toCountryRiskRow(row),
    summary: row.summary,
    series: {
      fx: toDisplaySeries(row.series.fx),
      riskScore: toDisplaySeries(row.series.risk_score),
      newsSentiment: toDisplaySeries(row.series.news_sentiment),
    },
    breakdown: {
      fxDepreciationScore: row.breakdown.fx_depreciation_score,
      fxVolatilityScore: row.breakdown.fx_volatility_score,
      newsStressScore: row.breakdown.news_stress_score,
      macroStressScore: row.breakdown.macro_stress_score,
    },
    drivers: row.drivers,
    newsSignal: row.news_signal ? toNewsSignal(row.news_signal) : null,
    macroSignal: row.macro_signal ? toMacroSignal(row.macro_signal) : null,
    mlSignal: row.ml_signal ? toMlSignal(row.ml_signal) : null,
  };
}

function toNewsSignal(signal: ApiNewsSignal): NewsSignal {
  return {
    countryCode: signal.country_code,
    countryName: signal.country_name,
    currency: signal.currency,
    asOf: signal.as_of,
    source: signal.source,
    query: signal.query,
    articleCount: signal.article_count,
    newsStressScore: signal.news_stress_score,
    averageSentiment: signal.average_sentiment,
    negativeArticleShare: signal.negative_article_share,
    crisisThemeShare: signal.crisis_theme_share,
    articles: signal.articles.map(toNewsArticle),
  };
}

function toNewsArticle(article: ApiNewsArticle): NewsArticle {
  return {
    title: article.title,
    url: article.url,
    domain: article.domain,
    language: article.language,
    sourceCountry: article.source_country,
    seenAt: article.seen_at,
    sentimentScore: article.sentiment_score,
    stressProbability: article.stress_probability,
    themeHits: article.theme_hits,
  };
}

function toMacroSignal(signal: ApiMacroSignal): MacroSignal {
  return {
    countryCode: signal.country_code,
    countryName: signal.country_name,
    currency: signal.currency,
    asOf: signal.as_of,
    source: signal.source,
    macroStressScore: signal.macro_stress_score,
    indicators: signal.indicators.map(toMacroIndicator),
  };
}

function toMacroIndicator(indicator: ApiMacroIndicator): MacroIndicator {
  return {
    name: indicator.name,
    indicatorCode: indicator.indicator_code,
    value: indicator.value,
    year: indicator.year,
    stressScore: indicator.stress_score,
    description: indicator.description,
  };
}

function toMlSignal(signal: ApiMlSignal): MlSignal {
  return {
    countryCode: signal.country_code,
    countryName: signal.country_name,
    currency: signal.currency,
    status: signal.status,
    modelType: signal.model_type,
    predictedLabel: signal.predicted_label,
    crisisProbability: signal.crisis_probability,
    classProbabilities: signal.class_probabilities,
    features: signal.features,
    topFeatures: signal.top_features.map(toMlFeatureImportance),
    trainingExamples: signal.training_examples,
    source: signal.source,
  };
}

function toMlFeatureImportance(item: ApiMlFeatureImportance): MlFeatureImportance {
  return {
    feature: item.feature,
    importance: item.importance,
  };
}

function toMlMetricReport(metrics: ApiMlMetricReport): MlMetricReport {
  return {
    accuracy: metrics.accuracy,
    macroF1: metrics.macro_f1,
    crisisPrecision: metrics.crisis_precision,
    crisisRecall: metrics.crisis_recall,
    trainingExamples: metrics.training_examples,
    testExamples: metrics.test_examples,
    classDistribution: metrics.class_distribution,
  };
}

function toMlModelInfo(info: ApiMlModelInfo): MlModelInfo {
  return {
    modelType: info.model_type,
    status: info.status,
    selectedModel: info.selected_model,
    source: info.source,
    labels: info.labels,
    features: info.features,
    metrics: info.metrics ? toMlMetricReport(info.metrics) : null,
    modelComparison: Object.fromEntries(
      Object.entries(info.model_comparison).map(([name, metrics]) => [name, toMlMetricReport(metrics)]),
    ),
    featureImportance: info.feature_importance.map(toMlFeatureImportance),
    nlpEvaluation: info.nlp_evaluation ? toNlpEvaluationReport(info.nlp_evaluation) : null,
    limitations: info.limitations,
  };
}

function toNlpEvaluationReport(report: ApiNlpEvaluationReport): NlpEvaluationReport {
  return {
    modelType: report.model_type,
    holdoutExamples: report.holdout_examples,
    accuracy: report.accuracy,
    stressPrecision: report.stress_precision,
    stressRecall: report.stress_recall,
    stablePrecision: report.stable_precision,
    stableRecall: report.stable_recall,
  };
}

function toDisplaySeries(points: SeriesPoint[]): SeriesPoint[] {
  return points.map((point) => ({
    ...point,
    date: point.date.length >= 10 ? point.date.slice(5) : point.date,
  }));
}

export async function fetchGlobalRisk(): Promise<GlobalRiskData> {
  const response = await fetch(`${getApiBaseUrl()}/api/risk/global`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`AtlasFX API returned ${response.status}`);
  }

  const data = (await response.json()) as ApiGlobalRiskResponse;
  return {
    asOf: data.as_of,
    globalRiskMode: data.global_risk_mode,
    dataSource: data.data_source,
    countries: data.countries.map(toCountryRiskRow),
  };
}

export async function fetchCountryRisk(countryCode: string): Promise<CountryRiskDetail> {
  const response = await fetch(`${getApiBaseUrl()}/api/risk/country/${countryCode}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`AtlasFX API returned ${response.status}`);
  }

  return toCountryRiskDetail((await response.json()) as ApiCountryRiskDetail);
}

export async function fetchModelInfo(): Promise<MlModelInfo> {
  const response = await fetch(`${getApiBaseUrl()}/api/model/feature-importance`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`AtlasFX API returned ${response.status}`);
  }

  return toMlModelInfo((await response.json()) as ApiMlModelInfo);
}
