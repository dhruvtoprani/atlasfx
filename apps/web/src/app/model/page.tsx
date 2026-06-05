import { Brain, Sigma } from "lucide-react";

import { SCORE_WEIGHTS } from "@/lib/atlas-data";
import { fetchModelInfo } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import type { MlModelInfo } from "@/types/atlas";

export const dynamic = "force-dynamic";

const weights: [string, number][] = [
  ["FX Depreciation Score", SCORE_WEIGHTS.fxDepreciationScore],
  ["FX Volatility Score", SCORE_WEIGHTS.fxVolatilityScore],
  ["News Stress Score", SCORE_WEIGHTS.newsStressScore],
  ["Macro Stress Score", SCORE_WEIGHTS.macroStressScore],
];

const fallbackModelInfo: MlModelInfo = {
  modelType: "Logistic regression FX regime classifier",
  status: "API offline",
  selectedModel: null,
  source: "Frankfurter historical FX windows",
  labels: ["Stable", "Watchlist", "Stress", "Crisis Risk"],
  features: ["fx_depreciation_30d", "fx_depreciation_90d", "fx_volatility_30d", "fx_volatility_90d"],
  metrics: null,
  modelComparison: {},
  featureImportance: [],
  nlpEvaluation: null,
  limitations: ["Run the FastAPI backend to train and inspect the live classifier."],
};

export default async function ModelPage() {
  const modelInfo = await fetchModelInfo().catch(() => fallbackModelInfo);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md border border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
            <Sigma className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Methodology</p>
            <h1 className="text-3xl font-semibold text-white">AtlasFX Stress Score + ML Classifier</h1>
          </div>
        </div>
        <div className="mt-6 rounded-lg border border-white/10 bg-black/20 p-5 font-mono text-sm leading-7 text-slate-300">
          AtlasFX Stress Score = 0.35 * FX Depreciation + 0.25 * FX Volatility + 0.20 * News Stress + 0.20 * Macro Stress
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-4">
        {weights.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
            <p className="mt-4 font-mono text-3xl text-white">{formatNumber(value * 100, 0)}%</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
          <Brain className="size-7 text-violet-200" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-white">{modelInfo.modelType}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">{modelInfo.source}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Metric label="Status" value={modelInfo.status} />
            <Metric label="Selected Model" value={modelInfo.selectedModel ?? "N/A"} />
            <Metric
              label="Training Rows"
              value={modelInfo.metrics ? formatNumber(modelInfo.metrics.trainingExamples, 0) : "N/A"}
            />
            <Metric label="Accuracy" value={formatMetric(modelInfo.metrics?.accuracy)} />
            <Metric label="Macro F1" value={formatMetric(modelInfo.metrics?.macroF1)} />
            <Metric label="Crisis Recall" value={formatMetric(modelInfo.metrics?.crisisRecall)} />
            <Metric label="Crisis Precision" value={formatMetric(modelInfo.metrics?.crisisPrecision)} />
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
          <h2 className="text-xl font-semibold text-white">Feature Importance</h2>
          <div className="mt-4 grid gap-3">
            {modelInfo.featureImportance.length > 0 ? (
              modelInfo.featureImportance.map((item) => (
                <div key={item.feature} className="rounded-md border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-300">{formatFeatureName(item.feature)}</span>
                    <span className="font-mono text-cyan-100">{formatNumber(item.importance * 100, 0)}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-cyan-300" style={{ width: `${item.importance * 100}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                Start the API to train the classifier and load feature importance.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
          <h2 className="text-xl font-semibold text-white">Classifier Model Comparison</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4 font-medium">Model</th>
                  <th className="py-3 pr-4 font-medium">Accuracy</th>
                  <th className="py-3 pr-4 font-medium">Macro F1</th>
                  <th className="py-3 pr-4 font-medium">Crisis Recall</th>
                  <th className="py-3 pr-4 font-medium">Crisis Precision</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(modelInfo.modelComparison).map(([name, metrics]) => (
                  <tr key={name} className="border-t border-white/10 text-slate-300">
                    <td className="py-3 pr-4 font-medium text-white">{name}</td>
                    <td className="py-3 pr-4 font-mono">{formatMetric(metrics.accuracy)}</td>
                    <td className="py-3 pr-4 font-mono">{formatMetric(metrics.macroF1)}</td>
                    <td className="py-3 pr-4 font-mono">{formatMetric(metrics.crisisRecall)}</td>
                    <td className="py-3 pr-4 font-mono">{formatMetric(metrics.crisisPrecision)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
          <h2 className="text-xl font-semibold text-white">NLP Holdout Evaluation</h2>
          {modelInfo.nlpEvaluation ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Metric label="Examples" value={formatNumber(modelInfo.nlpEvaluation.holdoutExamples, 0)} />
              <Metric label="Accuracy" value={formatMetric(modelInfo.nlpEvaluation.accuracy)} />
              <Metric label="Stress Recall" value={formatMetric(modelInfo.nlpEvaluation.stressRecall)} />
              <Metric label="Stress Precision" value={formatMetric(modelInfo.nlpEvaluation.stressPrecision)} />
              <Metric label="Stable Recall" value={formatMetric(modelInfo.nlpEvaluation.stableRecall)} />
              <Metric label="Stable Precision" value={formatMetric(modelInfo.nlpEvaluation.stablePrecision)} />
            </div>
          ) : (
            <p className="mt-4 rounded-md border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              Start the API to evaluate the local headline NLP model.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
        <h2 className="text-xl font-semibold text-white">Limitations</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {modelInfo.limitations.map((item) => (
            <div key={item} className="rounded-md border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              {item}
            </div>
          ))}
        </div>
      </section>

      {modelInfo.metrics ? (
        <section className="rounded-lg border border-white/10 bg-white/[0.045] p-6">
          <h2 className="text-xl font-semibold text-white">Training Label Distribution</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {Object.entries(modelInfo.metrics.classDistribution).map(([label, count]) => (
              <div key={label} className="rounded-md border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="mt-2 font-mono text-3xl text-white">{formatNumber(count, 0)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 font-mono text-lg text-white">{value}</p>
    </div>
  );
}

function formatMetric(value: number | null | undefined) {
  if (value === null || value === undefined) return "N/A";
  return formatNumber(value, 3);
}

function formatFeatureName(feature: string) {
  return feature.replace("fx_", "").replaceAll("_", " ");
}
