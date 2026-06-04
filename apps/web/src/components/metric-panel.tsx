import { cn } from "@/lib/utils";

export function MetricPanel({
  label,
  value,
  detail,
  className,
}: {
  label: string;
  value: string;
  detail: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/20", className)}>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}
