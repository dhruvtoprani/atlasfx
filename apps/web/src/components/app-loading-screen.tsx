"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, DatabaseZap, Loader2, RadioTower, Satellite, TriangleAlert } from "lucide-react";

import { cn, formatNumber } from "@/lib/utils";
import type { ConnectorStatus } from "@/types/atlas";

type AppLoadingScreenProps = {
  title?: string;
  detail?: string;
  connectors?: ConnectorStatus[];
  error?: string;
  isComplete?: boolean;
};

const defaultConnectors: ConnectorStatus[] = [
  {
    name: "Frankfurter FX",
    status: "pending",
    required: true,
    latencyMs: 0,
    detail: "Checking live exchange-rate connectivity.",
  },
  {
    name: "News RSS/GDELT",
    status: "pending",
    required: true,
    latencyMs: 0,
    detail: "Checking headline source availability.",
  },
  {
    name: "World Bank macro",
    status: "pending",
    required: true,
    latencyMs: 0,
    detail: "Checking macro indicator coverage.",
  },
  {
    name: "Local headline NLP",
    status: "pending",
    required: true,
    latencyMs: 0,
    detail: "Loading the local stress classifier.",
  },
  {
    name: "Global risk payload",
    status: "pending",
    required: true,
    latencyMs: 0,
    detail: "Preloading country stress rows.",
  },
];

const bootPhases = [
  "Opening market data links",
  "Scanning currency pressure",
  "Reading global headlines",
  "Scoring macro fragility",
  "Calibrating ML signal",
  "Signal lock confirmed",
];

export function AppLoadingScreen({
  title = "Establishing AtlasFX data links",
  detail = "Loading FX, news NLP, macro, and risk payloads before rendering the dashboard.",
  connectors = defaultConnectors,
  error,
  isComplete = false,
}: AppLoadingScreenProps) {
  const healthyCount = connectors.filter((connector) => connector.status === "healthy").length;
  const connectorProgress = connectors.length ? healthyCount / connectors.length : 0;
  const targetProgress = error ? Math.max(connectorProgress, 0.18) : isComplete ? 1 : Math.max(connectorProgress, 0.84);
  const [visualProgress, setVisualProgress] = useState(0.04);
  const phase = useMemo(() => {
    if (isComplete) {
      return bootPhases[bootPhases.length - 1];
    }

    const phaseIndex = Math.min(bootPhases.length - 2, Math.floor(visualProgress * (bootPhases.length - 1)));
    return bootPhases[phaseIndex];
  }, [isComplete, visualProgress]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVisualProgress((current) => {
        if (targetProgress < current) {
          return current;
        }

        const distance = targetProgress - current;
        if (distance < 0.006) {
          return targetProgress;
        }

        return Math.min(targetProgress, current + distance * 0.09);
      });
    }, 70);

    return () => window.clearInterval(interval);
  }, [targetProgress]);

  return (
    <div className="atlas-boot-grid relative min-h-screen overflow-hidden bg-[#05070b] px-5 py-6 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(59,130,246,0.12),transparent_36%)]" />
      <div className="pointer-events-none absolute left-0 right-0 top-1/3 h-px bg-cyan-200/30 shadow-[0_0_40px_rgba(34,211,238,0.9)] atlas-scanline" />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col justify-center">
        <div className="atlas-boot-card rounded-2xl border border-cyan-300/20 bg-white/[0.045] p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-cyan-100">
                <RadioTower className="size-3.5" aria-hidden="true" />
                API Connectivity Gate
              </div>
              <h1 className="mt-5 max-w-2xl text-3xl font-semibold text-white md:text-5xl">{title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">{detail}</p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-slate-300">
                <Satellite className="size-3.5 text-cyan-200" aria-hidden="true" />
                <span className="font-mono uppercase tracking-[0.14em] text-cyan-100">{phase}</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <Loader2 className="size-7 animate-spin text-cyan-200" aria-hidden="true" />
              <p className="mt-4 font-mono text-3xl text-white">{formatNumber(visualProgress * 100, 0)}%</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">Boot Progress</p>
            </div>
          </div>

          <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 shadow-[0_0_24px_rgba(34,211,238,0.55)] transition-all duration-500"
              style={{ width: `${Math.max(8, visualProgress * 100)}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-6 gap-2" aria-hidden="true">
            {bootPhases.map((phaseLabel, index) => (
              <div
                key={phaseLabel}
                className={cn(
                  "h-1 rounded-full transition-colors duration-500",
                  visualProgress * bootPhases.length >= index
                    ? "bg-cyan-200/80 shadow-[0_0_16px_rgba(34,211,238,0.35)]"
                    : "bg-white/10",
                )}
              />
            ))}
          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <p>{error}</p>
              </div>
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {connectors.map((connector) => (
              <ConnectorRow key={connector.name} connector={connector} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectorRow({ connector }: { connector: ConnectorStatus }) {
  const healthy = connector.status === "healthy";
  const pending = connector.status === "pending";

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-white">{connector.name}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{connector.detail}</p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-xs",
            healthy && "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
            pending && "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
            !healthy && !pending && "border-red-300/25 bg-red-300/10 text-red-100",
          )}
        >
          {healthy ? (
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
          ) : pending ? (
            <Activity className="size-3.5" aria-hidden="true" />
          ) : (
            <DatabaseZap className="size-3.5" aria-hidden="true" />
          )}
          {connector.status}
        </span>
      </div>
      {connector.latencyMs > 0 ? (
        <p className="mt-3 font-mono text-xs text-slate-500">{formatNumber(connector.latencyMs, 0)}ms</p>
      ) : null}
    </div>
  );
}
