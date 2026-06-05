"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { AppLoadingScreen } from "@/components/app-loading-screen";
import { fetchCountryRisk, fetchGlobalRisk, fetchModelInfo, fetchReadiness } from "@/lib/api";
import type { ConnectorStatus } from "@/types/atlas";

const MIN_INITIAL_BOOT_MS = 2_600;
const COMPLETE_HOLD_MS = 800;

export function DataBootGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const routeCountryCode = getRouteCountryCode(pathname);
  const needsModelInfo = pathname === "/model";
  const [bootStartedAt] = useState(() => Date.now());
  const [initialBootCanReveal, setInitialBootCanReveal] = useState(false);

  const readinessQuery = useQuery({
    queryKey: ["system-readiness"],
    queryFn: fetchReadiness,
    refetchInterval: (query) => (query.state.data?.status === "ready" ? false : 10_000),
    retry: 3,
    staleTime: 5 * 60_000,
  });

  const globalRiskQuery = useQuery({
    queryKey: ["global-risk"],
    queryFn: fetchGlobalRisk,
    enabled: readinessQuery.data?.status === "ready",
    retry: 3,
    staleTime: 60_000,
  });

  const countryRiskQuery = useQuery({
    queryKey: ["country-risk", routeCountryCode],
    queryFn: () => {
      if (!routeCountryCode) {
        throw new Error("Country code is required before loading country risk.");
      }
      return fetchCountryRisk(routeCountryCode);
    },
    enabled: readinessQuery.data?.status === "ready" && Boolean(routeCountryCode),
    retry: 3,
    staleTime: 60_000,
  });

  const modelInfoQuery = useQuery({
    queryKey: ["model-info"],
    queryFn: fetchModelInfo,
    enabled: readinessQuery.data?.status === "ready" && needsModelInfo,
    retry: 3,
    staleTime: 5 * 60_000,
  });

  const routePayloadReady =
    (!routeCountryCode || countryRiskQuery.isSuccess) && (!needsModelInfo || modelInfoQuery.isSuccess);
  const dataReady = readinessQuery.data?.status === "ready" && globalRiskQuery.isSuccess && routePayloadReady;

  useEffect(() => {
    if (!dataReady || initialBootCanReveal) {
      return;
    }

    const elapsed = Date.now() - bootStartedAt;
    const revealDelay = Math.max(MIN_INITIAL_BOOT_MS - elapsed, COMPLETE_HOLD_MS);
    const timer = window.setTimeout(() => {
      setInitialBootCanReveal(true);
    }, revealDelay);

    return () => window.clearTimeout(timer);
  }, [bootStartedAt, dataReady, initialBootCanReveal]);

  if (dataReady && initialBootCanReveal) {
    return <div className="atlas-dashboard-reveal">{children}</div>;
  }

  const connectors = getDisplayConnectors({
    connectors: readinessQuery.data?.connectors,
    routeCountryCode,
    countryRiskReady: countryRiskQuery.isSuccess,
    needsModelInfo,
    modelInfoReady: modelInfoQuery.isSuccess,
  });
  const loadingDetail = getLoadingDetail({
    readinessReady: readinessQuery.data?.status === "ready",
    globalRiskReady: globalRiskQuery.isSuccess,
    routeCountryCode,
    countryRiskReady: countryRiskQuery.isSuccess,
    needsModelInfo,
    modelInfoReady: modelInfoQuery.isSuccess,
  });
  const error =
    readinessQuery.error instanceof Error
      ? readinessQuery.error.message
      : globalRiskQuery.error instanceof Error
        ? globalRiskQuery.error.message
        : countryRiskQuery.error instanceof Error
          ? countryRiskQuery.error.message
          : modelInfoQuery.error instanceof Error
            ? modelInfoQuery.error.message
            : undefined;

  return (
    <AppLoadingScreen
      title="Loading live AtlasFX signals"
      detail={loadingDetail}
      connectors={connectors}
      error={error}
      isComplete={dataReady}
    />
  );
}

function getRouteCountryCode(pathname: string): string | null {
  const match = pathname.match(/^\/country\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]).toUpperCase() : null;
}

function getLoadingDetail({
  readinessReady,
  globalRiskReady,
  routeCountryCode,
  countryRiskReady,
  needsModelInfo,
  modelInfoReady,
}: {
  readinessReady: boolean;
  globalRiskReady: boolean;
  routeCountryCode: string | null;
  countryRiskReady: boolean;
  needsModelInfo: boolean;
  modelInfoReady: boolean;
}) {
  if (!readinessReady) {
    return "Checking Frankfurter FX, Google News/GDELT, World Bank macro, local NLP, and the global country payload.";
  }

  if (!globalRiskReady) {
    return "Connector checks passed. Loading the global country risk payload before rendering.";
  }

  if (routeCountryCode && !countryRiskReady) {
    return `Global signals are loaded. Loading live ${routeCountryCode} country detail before rendering.`;
  }

  if (needsModelInfo && !modelInfoReady) {
    return "Global signals are loaded. Loading classifier metrics and feature importance before rendering.";
  }

  return "Finalizing live AtlasFX data before rendering.";
}

function getDisplayConnectors({
  connectors,
  routeCountryCode,
  countryRiskReady,
  needsModelInfo,
  modelInfoReady,
}: {
  connectors?: ConnectorStatus[];
  routeCountryCode: string | null;
  countryRiskReady: boolean;
  needsModelInfo: boolean;
  modelInfoReady: boolean;
}) {
  const rows = [...(connectors ?? [])];

  if (routeCountryCode) {
    rows.push({
      name: `${routeCountryCode} country payload`,
      status: countryRiskReady ? "healthy" : "pending",
      required: true,
      latencyMs: 0,
      detail: "Loading FX chart, macro indicators, NLP headlines, and ML signal.",
    });
  }

  if (needsModelInfo) {
    rows.push({
      name: "Classifier diagnostics",
      status: modelInfoReady ? "healthy" : "pending",
      required: true,
      latencyMs: 0,
      detail: "Loading model comparison, metrics, and feature importance.",
    });
  }

  return rows.length ? rows : undefined;
}
