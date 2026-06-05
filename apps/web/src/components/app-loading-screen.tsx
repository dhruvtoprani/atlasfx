import { Activity, CheckCircle2, DatabaseZap, Loader2, RadioTower, TriangleAlert } from "lucide-react";

import { cn, formatNumber } from "@/lib/utils";
import type { ConnectorStatus } from "@/types/atlas";

type AppLoadingScreenProps = {
  title?: string;
  detail?: string;
  connectors?: ConnectorStatus[];
  error?: string;
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

export function AppLoadingScreen({
  title = "Establishing AtlasFX data links",
  detail = "Loading FX, news NLP, macro, and risk payloads before rendering the dashboard.",
  connectors = defaultConnectors,
  error,
}: AppLoadingScreenProps) {
  const healthyCount = connectors.filter((connector) => connector.status === "healthy").length;
  const progress = connectors.length ? healthyCount / connectors.length : 0;

  return (
    <div className="min-h-screen bg-[#05070b] px-5 py-6 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col justify-center">
        <div className="rounded-2xl border border-cyan-300/20 bg-white/[0.045] p-6 shadow-2xl shadow-cyan-950/20 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-cyan-100">
                <RadioTower className="size-3.5" aria-hidden="true" />
                API Connectivity Gate
              </div>
              <h1 className="mt-5 max-w-2xl text-3xl font-semibold text-white md:text-5xl">{title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">{detail}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <Loader2 className="size-7 animate-spin text-cyan-200" aria-hidden="true" />
              <p className="mt-4 font-mono text-3xl text-white">{formatNumber(progress * 100, 0)}%</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">Boot Progress</p>
            </div>
          </div>

          <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-cyan-300 transition-all duration-500"
              style={{ width: `${Math.max(8, progress * 100)}%` }}
            />
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
