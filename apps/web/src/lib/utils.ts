import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { RiskLabel } from "@/types/atlas";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, digits = 1) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function riskColor(label: RiskLabel) {
  switch (label) {
    case "Stable":
      return "#22c55e";
    case "Watchlist":
      return "#facc15";
    case "Stress":
      return "#fb923c";
    case "Storm":
      return "#ef4444";
    case "Crisis Risk":
      return "#a855f7";
  }
}

export function riskClassName(label: RiskLabel) {
  switch (label) {
    case "Stable":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
    case "Watchlist":
      return "border-yellow-300/30 bg-yellow-300/10 text-yellow-100";
    case "Stress":
      return "border-orange-400/30 bg-orange-400/10 text-orange-100";
    case "Storm":
      return "border-red-400/30 bg-red-400/10 text-red-100";
    case "Crisis Risk":
      return "border-violet-400/40 bg-violet-400/10 text-violet-100";
  }
}
