import { RankingsTable } from "@/components/rankings-table";
import { fallbackGlobalRiskData, fetchGlobalRisk } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function RankingsPage() {
  const initialData = await fetchGlobalRisk().catch(() => fallbackGlobalRiskData);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Country Ranking</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Stress Leaderboard</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
          Sort by total stress, depreciation, or volatility across the Frankfurter-supported AtlasFX country universe.
        </p>
      </section>
      <RankingsTable initialData={initialData} />
    </div>
  );
}
