"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, DatabaseZap, ShieldAlert, TrendingDown, Waves } from "lucide-react";

import { MetricPanel } from "@/components/metric-panel";
import { MoneyWeatherMap } from "@/components/money-weather-map";
import { RiskBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { DISCLAIMER } from "@/lib/atlas-data";
import { fallbackGlobalRiskData, fetchGlobalRisk, type GlobalRiskData } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

export function DashboardClient({ initialData = fallbackGlobalRiskData }: { initialData?: GlobalRiskData }) {
  const { data, isFetching, isError } = useQuery({
    queryKey: ["global-risk"],
    queryFn: fetchGlobalRisk,
    initialData,
    refetchOnMount: "always",
    staleTime: 60_000,
    retry: 1,
  });

  const countries = data.countries;
  const topStressed = countries.slice(0, 5);
  const improving = [...countries].sort((a, b) => a.fx30dDepreciation - b.fx30dDepreciation).slice(0, 4);
  const averageRisk = countries.reduce((total, country) => total + country.riskScore, 0) / countries.length;
  const sourceLabel = sourceStatus(data, isError, isFetching);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-cyan-200">Global money weather</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
                AtlasFX
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                A currency stress radar combining FX depreciation, volatility, RSS headline NLP, and World Bank macro signals.
              </p>
            </div>
            <Link href="/rankings">
              <Button variant="primary">
                Open Rankings
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
          <MoneyWeatherMap countries={countries} />
        </div>
        <aside className="grid gap-4 content-start">
          <MetricPanel label="Global Mode" value={data.globalRiskMode} detail="Average country stress across the AtlasFX universe." />
          <MetricPanel label="Average Score" value={formatNumber(averageRisk)} detail="Weighted rule-based AtlasFX Stress Score." />
          <MetricPanel label="Country Universe" value={String(countries.length)} detail="Live monitored countries and regions." />
          <MetricPanel label="Data Source" value={data.asOf} detail={sourceLabel} />
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.045]">
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Top Stressed</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Storm Watch</h2>
            </div>
            <ShieldAlert className="size-5 text-red-300" aria-hidden="true" />
          </div>
          <div className="divide-y divide-white/10">
            {topStressed.map((country) => (
              <Link
                key={country.countryCode}
                href={`/country/${country.countryCode}`}
                className="grid grid-cols-[1fr_auto] gap-4 p-5 transition hover:bg-white/[0.035]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white">{country.countryName}</h3>
                    <span className="text-xs text-slate-500">{country.currency}</span>
                    <RiskBadge label={country.riskLabel} />
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{country.topDriver}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl text-white">{formatNumber(country.riskScore)}</p>
                  <p className="text-xs text-slate-500">{formatNumber(country.fx30dDepreciation)}% 30d dep.</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.045]">
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Improving</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Relative Relief</h2>
            </div>
            <TrendingDown className="size-5 text-emerald-300" aria-hidden="true" />
          </div>
          <div className="divide-y divide-white/10">
            {improving.map((country) => (
              <Link
                key={country.countryCode}
                href={`/country/${country.countryCode}`}
                className="flex items-center justify-between gap-4 p-5 transition hover:bg-white/[0.035]"
              >
                <div>
                  <h3 className="font-semibold text-white">{country.countryName}</h3>
                  <p className="mt-1 text-sm text-slate-500">{country.dataQuality}</p>
                </div>
                <div className="text-right">
                  <RiskBadge label={country.riskLabel} />
                  <p className="mt-2 font-mono text-sm text-emerald-200">{formatNumber(country.fx30dDepreciation)}%</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-5 md:grid-cols-[auto_1fr] md:items-center">
        <span className="grid size-10 place-items-center rounded-md border border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
          <Waves className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm leading-6 text-slate-300">{DISCLAIMER}</p>
          <p className="mt-2 inline-flex items-center gap-2 text-xs text-cyan-100">
            <DatabaseZap className="size-3.5" aria-hidden="true" />
            {sourceLabel}
          </p>
        </div>
      </section>
    </div>
  );
}

function sourceStatus(data: GlobalRiskData, isError: boolean, isFetching: boolean) {
  if (isError) return "API offline; showing static MVP fallback";
  if (isFetching && data.dataSource === fallbackGlobalRiskData.dataSource) return "Connecting to AtlasFX API";
  return data.dataSource;
}
