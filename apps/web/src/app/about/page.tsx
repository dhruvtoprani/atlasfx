import { Database, Globe2, Map, ShieldAlert } from "lucide-react";

import { DISCLAIMER } from "@/lib/atlas-data";

const items = [
  { icon: Globe2, title: "Research Objective", body: "Combine FX behavior, macro conditions, and news sentiment into country-level stress signals." },
  { icon: Database, title: "Data Sources", body: "Frankfurter powers FX. Google News RSS feeds the local NLP layer. World Bank powers macro stress." },
  { icon: Map, title: "Roadmap", body: "Persist source snapshots, add chronological ML backtests, and upgrade explanations with permutation importance or SHAP." },
  { icon: ShieldAlert, title: "Disclaimer", body: DISCLAIMER },
];

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">About</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">AtlasFX Research Dashboard</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
          AtlasFX turns global currency movement into a live economic weather map for portfolio-ready financial ML research.
        </p>
      </section>
      <section className="grid gap-5 md:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
              <Icon className="size-6 text-cyan-200" aria-hidden="true" />
              <h2 className="mt-5 text-xl font-semibold text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{item.body}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
