"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CountryRiskDetail, SeriesPoint } from "@/types/atlas";

const axisStyle = { fill: "#94a3b8", fontSize: 12 };

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-white/10 bg-[#05070b]/95 px-3 py-2 text-sm shadow-xl">
      <p className="text-slate-400">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="font-medium text-cyan-100">
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}

export function TrendLineChart({
  data,
  color = "#22d3ee",
  name,
}: {
  data: SeriesPoint[];
  color?: string;
  name: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 12, right: 16, left: -14, bottom: 0 }}>
        <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} minTickGap={22} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Line type="monotone" dataKey="value" name={name} stroke={color} strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BreakdownBars({ country }: { country: CountryRiskDetail }) {
  const data = [
    { name: "FX dep.", value: Math.round(country.breakdown.fxDepreciationScore) },
    { name: "Volatility", value: Math.round(country.breakdown.fxVolatilityScore) },
    { name: "News", value: country.breakdown.newsStressScore },
    { name: "Macro", value: country.breakdown.macroStressScore },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 12, right: 16, left: -14, bottom: 0 }}>
        <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} domain={[0, 100]} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="value" name="Score" fill="#22d3ee" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
