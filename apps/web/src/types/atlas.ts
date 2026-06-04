export type RiskLabel = "Stable" | "Watchlist" | "Stress" | "Storm" | "Crisis Risk";

export type CountryMeta = {
  countryCode: string;
  countryName: string;
  currency: string;
  region: string;
  latitude: number;
  longitude: number;
  frankfurterSupported: boolean;
};

export type CountryRiskRow = CountryMeta & {
  riskScore: number;
  riskLabel: RiskLabel;
  fx30dDepreciation: number;
  fxVolatility30d: number;
  newsStressScore: number;
  macroStressScore: number;
  topDriver: string;
  dataQuality: string;
};

export type SeriesPoint = {
  date: string;
  value: number;
};

export type NewsArticle = {
  title: string;
  url: string;
  domain?: string | null;
  language?: string | null;
  sourceCountry?: string | null;
  seenAt?: string | null;
  sentimentScore: number;
  stressProbability: number;
  themeHits: string[];
};

export type NewsSignal = {
  countryCode: string;
  countryName: string;
  currency: string;
  asOf: string;
  source: string;
  query: string;
  articleCount: number;
  newsStressScore: number;
  averageSentiment: number;
  negativeArticleShare: number;
  crisisThemeShare: number;
  articles: NewsArticle[];
};

export type MacroIndicator = {
  name: string;
  indicatorCode: string;
  value: number | null;
  year: number | null;
  stressScore: number;
  description: string;
};

export type MacroSignal = {
  countryCode: string;
  countryName: string;
  currency: string;
  asOf: string;
  source: string;
  macroStressScore: number;
  indicators: MacroIndicator[];
};

export type MlFeatureImportance = {
  feature: string;
  importance: number;
};

export type MlMetricReport = {
  accuracy: number | null;
  macroF1: number | null;
  crisisPrecision: number | null;
  crisisRecall: number | null;
  trainingExamples: number;
  testExamples: number;
  classDistribution: Record<string, number>;
};

export type MlModelInfo = {
  modelType: string;
  status: string;
  source: string;
  labels: string[];
  features: string[];
  metrics: MlMetricReport | null;
  featureImportance: MlFeatureImportance[];
  limitations: string[];
};

export type MlSignal = {
  countryCode: string;
  countryName: string;
  currency: string;
  status: string;
  modelType: string;
  predictedLabel: string | null;
  crisisProbability: number | null;
  classProbabilities: Record<string, number>;
  features: Record<string, number>;
  topFeatures: MlFeatureImportance[];
  trainingExamples: number | null;
  source: string;
};

export type CountryRiskDetail = CountryRiskRow & {
  summary: string;
  series: {
    fx: SeriesPoint[];
    riskScore: SeriesPoint[];
    newsSentiment: SeriesPoint[];
  };
  breakdown: {
    fxDepreciationScore: number;
    fxVolatilityScore: number;
    newsStressScore: number;
    macroStressScore: number;
  };
  drivers: {
    feature: string;
    impact: number;
  }[];
  newsSignal?: NewsSignal | null;
  macroSignal?: MacroSignal | null;
  mlSignal?: MlSignal | null;
};
