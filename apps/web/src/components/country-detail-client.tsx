"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BrainCircuit, CircleDollarSign, DatabaseZap, ExternalLink, Landmark, Sigma } from "lucide-react";

import { BreakdownBars, TrendLineChart } from "@/components/risk-charts";
import { RiskBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { fetchCountryRisk } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import type { CountryRiskDetail } from "@/types/atlas";

export function CountryDetailClient({ initialCountry }: { initialCountry: CountryRiskDetail }) {
  const { data: country, isError, isFetching } = useQuery({
    queryKey: ["country-risk", initialCountry.countryCode],
    queryFn: () => fetchCountryRisk(initialCountry.countryCode),
    initialData: initialCountry,
    refetchOnMount: "always",
    staleTime: 60_000,
    retry: 1,
  });
  const sourceDetail = isError
    ? "API offline; static fallback"
    : isFetching && country.dataQuality === initialCountry.dataQuality
      ? "Connecting to AtlasFX API"
      : country.dataQuality;

  return (
    <div className="space-y-6">
      <Link href="/">
        <Button variant="ghost">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Map
        </Button>
      </Link>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{country.currency} Pressure Monitor</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">{country.countryName}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">{country.summary}</p>
            </div>
            <RiskBadge label={country.riskLabel} className="text-sm" />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <Metric label="Score" value={formatNumber(country.riskScore)} tone="text-white" />
            <Metric label="30d Dep." value={`${formatNumber(country.fx30dDepreciation)}%`} tone="text-orange-200" />
            <Metric label="30d Vol." value={`${formatNumber(country.fxVolatility30d)}%`} tone="text-cyan-100" />
            <div className="rounded-md border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Driver</p>
              <p className="mt-3 text-lg font-semibold text-white">{country.topDriver}</p>
            </div>
          </div>
        </div>
        <aside className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
          <CircleDollarSign className="size-7 text-cyan-200" aria-hidden="true" />
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-slate-500">Data Quality</p>
          <p className="mt-2 text-lg font-semibold text-white">{sourceDetail}</p>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Country pages pull Frankfurter FX where covered, RSS headlines scored by local NLP, and latest World Bank
            macro indicators. Source gaps use neutral no-data scores instead of mock stress.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-xs text-cyan-100">
            <DatabaseZap className="size-3.5" aria-hidden="true" />
            {country.series.fx.length} FX observations rendered
          </p>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">FX Movement</p>
          <h2 className="mt-2 text-xl font-semibold text-white">30-Day Depreciation Path</h2>
          <div className="mt-4">
            <TrendLineChart data={country.series.fx} name="FX depreciation" color="#fb923c" />
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Stress Score</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Risk Timeline</h2>
          <div className="mt-4">
            <TrendLineChart data={country.series.riskScore} name="Risk score" color="#a855f7" />
          </div>
        </div>
      </section>

      {country.newsSignal ? (
        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
            <BrainCircuit className="size-7 text-violet-200" aria-hidden="true" />
            <p className="mt-5 text-xs uppercase tracking-[0.16em] text-slate-500">Local News NLP</p>
            <h2 className="mt-2 text-xl font-semibold text-white">RSS Headline Stress Signal</h2>
            <div className="mt-5 grid gap-3">
              <Metric label="News Stress" value={formatNumber(country.newsSignal.newsStressScore)} tone="text-violet-100" />
              <Metric
                label="Negative Share"
                value={`${formatNumber(country.newsSignal.negativeArticleShare * 100, 0)}%`}
                tone="text-orange-100"
              />
              <Metric
                label="Avg Sentiment"
                value={formatNumber(country.newsSignal.averageSentiment, 2)}
                tone="text-cyan-100"
              />
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">{country.newsSignal.source}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Top Articles</p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {country.newsSignal.articleCount} headlines scored without an LLM
                </h2>
              </div>
              <span className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-slate-400">
                as of {country.newsSignal.asOf}
              </span>
            </div>
            <div className="mt-5 divide-y divide-white/10">
              {country.newsSignal.articles.length > 0 ? (
                country.newsSignal.articles.slice(0, 5).map((article) => (
                  <a
                    key={article.url}
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="grid gap-2 py-4 transition hover:bg-white/[0.025] sm:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="font-medium leading-6 text-slate-100">{article.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {[article.domain, article.sourceCountry, article.themeHits.join(", ")]
                          .filter(Boolean)
                          .join(" / ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <span className="font-mono text-sm text-violet-100">
                        {formatNumber(article.stressProbability * 100, 0)}
                      </span>
                      <ExternalLink className="size-4 text-slate-500" aria-hidden="true" />
                    </div>
                  </a>
                ))
              ) : (
                <p className="py-5 text-sm text-slate-400">
                  No recent RSS/GDELT headline matches were returned, so AtlasFX used a neutral no-data news score.
                </p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {country.macroSignal ? (
        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
            <Landmark className="size-7 text-emerald-200" aria-hidden="true" />
            <p className="mt-5 text-xs uppercase tracking-[0.16em] text-slate-500">Macro Layer</p>
            <h2 className="mt-2 text-xl font-semibold text-white">World Bank Stress Signal</h2>
            <div className="mt-5 grid gap-3">
              <Metric
                label="Macro Stress"
                value={formatNumber(country.macroSignal.macroStressScore)}
                tone="text-emerald-100"
              />
              <Metric
                label="Indicators"
                value={String(country.macroSignal.indicators.filter((indicator) => indicator.value !== null).length)}
                tone="text-cyan-100"
              />
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">{country.macroSignal.source}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Latest Indicators</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Macro fragility scored without mock data</h2>
              </div>
              <span className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-slate-400">
                as of {country.macroSignal.asOf}
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {country.macroSignal.indicators.map((indicator) => (
                <div key={indicator.indicatorCode} className="rounded-md border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-100">{indicator.name}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{indicator.description}</p>
                    </div>
                    <span className="font-mono text-sm text-emerald-100">{formatNumber(indicator.stressScore)}</span>
                  </div>
                  <p className="mt-4 font-mono text-sm text-slate-300">
                    {formatMacroValue(indicator.value)} {indicator.year ? `(${indicator.year})` : "(no recent value)"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {country.mlSignal ? (
        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
            <Sigma className="size-7 text-cyan-200" aria-hidden="true" />
            <p className="mt-5 text-xs uppercase tracking-[0.16em] text-slate-500">ML Classifier</p>
            <h2 className="mt-2 text-xl font-semibold text-white">FX Regime Prediction</h2>
            <div className="mt-5 grid gap-3">
              <Metric
                label="Predicted State"
                value={country.mlSignal.predictedLabel ?? "Unavailable"}
                tone="text-cyan-100"
              />
              <Metric
                label="Crisis Prob."
                value={
                  country.mlSignal.crisisProbability === null
                    ? "N/A"
                    : `${formatNumber(country.mlSignal.crisisProbability * 100, 0)}%`
                }
                tone="text-violet-100"
              />
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">{country.mlSignal.source}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Model Diagnostics</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{country.mlSignal.modelType}</h2>
              </div>
              <span className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-slate-400">
                {country.mlSignal.status}
              </span>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-md border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Class Probabilities</p>
                <div className="mt-4 space-y-3">
                  {Object.entries(country.mlSignal.classProbabilities).length > 0 ? (
                    Object.entries(country.mlSignal.classProbabilities).map(([label, probability]) => (
                      <ProgressRow key={label} label={label} value={probability} />
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">Classifier unavailable for this currency.</p>
                  )}
                </div>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Current FX Features</p>
                <div className="mt-4 space-y-3">
                  {Object.entries(country.mlSignal.features).length > 0 ? (
                    Object.entries(country.mlSignal.features).map(([feature, value]) => (
                      <div key={feature} className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-400">{formatFeatureName(feature)}</span>
                        <span className="font-mono text-slate-100">{formatNumber(value, 2)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No feature vector available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Breakdown</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Component Scores</h2>
          <div className="mt-4">
            <BreakdownBars country={country} />
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Drivers</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Weighted Signals</h2>
          <div className="mt-5 space-y-3">
            {country.drivers.map((driver) => (
              <div key={driver.feature} className="rounded-md border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-300">{driver.feature}</span>
                  <span className="font-mono text-sm text-cyan-100">{formatNumber(driver.impact, 2)}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-cyan-300" style={{ width: `${driver.impact * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 font-mono text-3xl ${tone}`}>{value}</p>
    </div>
  );
}

function formatMacroValue(value: number | null) {
  if (value === null) return "No value";
  return `${formatNumber(value, 2)}%`;
}

function formatFeatureName(feature: string) {
  return feature
    .replace("fx_", "")
    .replaceAll("_", " ")
    .replace("30d", "30d")
    .replace("90d", "90d");
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono text-cyan-100">{formatNumber(value * 100, 0)}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-cyan-300" style={{ width: `${Math.min(100, value * 100)}%` }} />
      </div>
    </div>
  );
}
