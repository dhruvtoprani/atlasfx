import type { RiskLabel } from "@/types/atlas";
import { cn, riskClassName } from "@/lib/utils";

export function RiskBadge({ label, className }: { label: RiskLabel; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold", riskClassName(label), className)}>
      {label}
    </span>
  );
}
