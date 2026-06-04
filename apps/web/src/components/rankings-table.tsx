"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { RiskBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { fallbackGlobalRiskData, fetchGlobalRisk, type GlobalRiskData } from "@/lib/api";
import { useAtlasStore } from "@/lib/store";
import { cn, formatNumber } from "@/lib/utils";

type SortKey = "riskScore" | "fx30dDepreciation" | "fxVolatility30d";

export function RankingsTable({ initialData }: { initialData: GlobalRiskData }) {
  const [sortKey, setSortKey] = useState<SortKey>("riskScore");
  const [query, setQuery] = useState("");
  const regionFilter = useAtlasStore((state) => state.regionFilter);
  const setRegionFilter = useAtlasStore((state) => state.setRegionFilter);
  const { data, isError, isFetching } = useQuery({
    queryKey: ["global-risk"],
    queryFn: fetchGlobalRisk,
    initialData,
    refetchOnMount: "always",
    staleTime: 60_000,
    retry: 1,
  });
  const activeCountries = data.countries;
  const activeRegions = useMemo(
    () => ["All", ...Array.from(new Set(activeCountries.map((country) => country.region))).sort()],
    [activeCountries],
  );

  const rows = useMemo(() => {
    return activeCountries
      .filter((country) => regionFilter === "All" || country.region === regionFilter)
      .filter((country) => `${country.countryName} ${country.currency}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b[sortKey] - a[sortKey]);
  }, [activeCountries, query, regionFilter, sortKey]);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045]">
      <div className="flex flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2">
          <Search className="size-4 text-slate-500" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search country or currency"
            className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600 md:w-72"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="size-4 text-slate-500" aria-hidden="true" />
          {activeRegions.map((region) => (
            <button
              key={region}
              onClick={() => setRegionFilter(region)}
              className={cn(
                "rounded-md border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:text-white",
                regionFilter === region && "border-cyan-300/40 bg-cyan-300/10 text-cyan-100",
              )}
            >
              {region}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          {isError
            ? "API offline; static fallback"
            : isFetching && data.dataSource === fallbackGlobalRiskData.dataSource
              ? "Connecting to AtlasFX API"
              : data.dataSource}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Country</th>
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">
                <Button size="sm" variant="ghost" onClick={() => setSortKey("riskScore")}>
                  Score <ArrowUpDown className="size-3.5" />
                </Button>
              </th>
              <th className="px-4 py-3 font-medium">
                <Button size="sm" variant="ghost" onClick={() => setSortKey("fx30dDepreciation")}>
                  30d Dep. <ArrowUpDown className="size-3.5" />
                </Button>
              </th>
              <th className="px-4 py-3 font-medium">
                <Button size="sm" variant="ghost" onClick={() => setSortKey("fxVolatility30d")}>
                  30d Vol. <ArrowUpDown className="size-3.5" />
                </Button>
              </th>
              <th className="px-4 py-3 font-medium">News</th>
              <th className="px-4 py-3 font-medium">Macro</th>
              <th className="px-4 py-3 font-medium">Driver</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((country) => (
              <tr key={country.countryCode} className="border-t border-white/10 text-slate-300 hover:bg-white/[0.035]">
                <td className="px-4 py-3">
                  <Link href={`/country/${country.countryCode}`} className="font-medium text-white hover:text-cyan-200">
                    {country.countryName}
                  </Link>
                  <span className="ml-2 text-xs text-slate-500">{country.currency}</span>
                </td>
                <td className="px-4 py-3">
                  <RiskBadge label={country.riskLabel} />
                </td>
                <td className="px-4 py-3 font-mono text-white">{formatNumber(country.riskScore)}</td>
                <td className="px-4 py-3 font-mono">{formatNumber(country.fx30dDepreciation)}%</td>
                <td className="px-4 py-3 font-mono">{formatNumber(country.fxVolatility30d)}%</td>
                <td className="px-4 py-3 font-mono">{formatNumber(country.newsStressScore, 0)}</td>
                <td className="px-4 py-3 font-mono">{formatNumber(country.macroStressScore, 0)}</td>
                <td className="px-4 py-3 text-slate-400">{country.topDriver}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
