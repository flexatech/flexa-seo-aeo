import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useScan } from "@/features/dashboard/useDashboard";
import { __, sprintf } from "@/lib/i18n";
import type { RecommendedItem, StepProps } from "./useOnboarding";
import { WizardFooter } from "./WizardFooter";

/** Score-band tone, matching the Dashboard's grade colours. */
function gradeTone(grade: string): { text: string; ring: string; bg: string } {
  switch (grade) {
    case "excellent":
    case "good":
      return {
        text: "fsa:text-emerald-600",
        ring: "fsa:text-emerald-500",
        bg: "fsa:bg-emerald-50",
      };
    case "fair":
      return {
        text: "fsa:text-amber-600",
        ring: "fsa:text-amber-500",
        bg: "fsa:bg-amber-50",
      };
    default:
      return {
        text: "fsa:text-red-600",
        ring: "fsa:text-red-500",
        bg: "fsa:bg-red-50",
      };
  }
}

/**
 * Screen 6: Final Readiness Report. On mount it fires one `POST /dashboard/scan`
 * (the existing route), which seeds the dashboard transient and the first trend
 * snapshot so the Dashboard the user lands on is warm and consistent with this
 * report. No confetti: it shows the real SEO/AEO/Technical scores, what setup
 * enabled, and the top next actions. Mirrors docs/onboarding-design.md §5.6.
 */
export function ReportStep({
  state,
  detect,
  recommended,
  onContinue,
  onBack,
  busy,
}: StepProps) {
  const scan = useScan();
  const fired = useRef(false);

  // Fire exactly one scan on mount. The ref guards against a StrictMode double
  // effect and any re-render, so only one POST /dashboard/scan ever goes out.
  useEffect(() => {
    if (!fired.current) {
      fired.current = true;
      scan.mutate();
    }
  }, [scan]);

  const report = scan.data;
  const enabled = enabledLabels(state.applied, recommended);
  const activePlugins = detect.seo_plugins.filter((plugin) => plugin.active);

  return (
    <div className="fsa:space-y-6">
      <div className="fsa:space-y-2">
        <h1 className="fsa:text-2xl fsa:font-bold fsa:text-slate-900">
          {__("Your site's readiness report")}
        </h1>
        <p className="fsa:text-sm fsa:text-slate-600">
          {__("Where you stand now, and the highest-value things to do next.")}
        </p>
      </div>

      {scan.isPending || (!report && !scan.isError) ? (
        <div className="fsa:flex fsa:items-center fsa:gap-2 fsa:rounded-xl fsa:border fsa:border-slate-200 fsa:bg-white fsa:p-6 fsa:text-sm fsa:text-slate-500 fsa:shadow-sm">
          <Loader2 className="fsa:h-4 fsa:w-4 fsa:animate-spin" aria-hidden />
          {__("Compiling your readiness report…")}
        </div>
      ) : null}

      {report ? (
        <div className="fsa:grid fsa:grid-cols-3 fsa:gap-3">
          <ScoreGauge
            label={__("SEO")}
            score={report.seo_score}
            grade={report.seo_grade}
          />
          <ScoreGauge
            label={__("AEO")}
            score={report.aeo_score}
            grade={report.aeo_grade}
          />
          <ScoreGauge
            label={__("Technical")}
            score={report.technical_score}
            grade={report.technical_grade}
          />
        </div>
      ) : null}

      {scan.isError ? (
        <div className="fsa:flex fsa:items-start fsa:gap-2 fsa:rounded-md fsa:border fsa:border-amber-200 fsa:bg-amber-50 fsa:p-3 fsa:text-xs fsa:text-amber-800">
          <AlertTriangle
            className="fsa:mt-0.5 fsa:h-4 fsa:w-4 fsa:shrink-0"
            aria-hidden
          />
          <span>
            {__(
              "We couldn't compile the full report. Run your first scan from the Dashboard.",
            )}
          </span>
        </div>
      ) : null}

      {enabled.length > 0 ? (
        <div className="fsa:rounded-xl fsa:border fsa:border-slate-200 fsa:bg-white fsa:p-5 fsa:shadow-sm">
          <div className="fsa:mb-3 fsa:flex fsa:items-center fsa:gap-2 fsa:text-sm fsa:font-semibold fsa:text-slate-900">
            <CheckCircle2
              className="fsa:h-4 fsa:w-4 fsa:text-emerald-600"
              aria-hidden
            />
            {__("Enabled during setup")}
          </div>
          <ul className="fsa:flex fsa:flex-wrap fsa:gap-2">
            {enabled.map((label) => (
              <li
                key={label}
                className="fsa:inline-flex fsa:items-center fsa:gap-1.5 fsa:rounded-full fsa:bg-emerald-50 fsa:px-2.5 fsa:py-1 fsa:text-xs fsa:font-medium fsa:text-emerald-700"
              >
                <CheckCircle2 className="fsa:h-3.5 fsa:w-3.5" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {report && report.recommendations.length > 0 ? (
        <div className="fsa:overflow-hidden fsa:rounded-xl fsa:border fsa:border-slate-200 fsa:bg-white fsa:shadow-sm">
          <div className="fsa:flex fsa:items-center fsa:gap-2 fsa:border-b fsa:border-slate-100 fsa:px-5 fsa:py-3 fsa:text-sm fsa:font-semibold fsa:text-slate-900">
            <Lightbulb
              className="fsa:h-4 fsa:w-4 fsa:text-brand-600"
              aria-hidden
            />
            {__("Recommended next actions")}
          </div>
          <ul className="fsa:divide-y fsa:divide-slate-100">
            {report.recommendations.slice(0, 3).map((rec) => (
              <li
                key={rec.id}
                className="fsa:flex fsa:items-start fsa:gap-3 fsa:px-5 fsa:py-3"
              >
                <ArrowRight
                  className="fsa:mt-0.5 fsa:h-4 fsa:w-4 fsa:shrink-0 fsa:text-slate-400"
                  aria-hidden
                />
                <div className="fsa:min-w-0">
                  <div className="fsa:text-sm fsa:font-medium fsa:text-slate-800">
                    {rec.label}
                  </div>
                  <div className="fsa:text-xs fsa:text-slate-500">
                    {rec.hint}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {activePlugins.length > 0 ? (
        <div className="fsa:flex fsa:items-start fsa:gap-2 fsa:rounded-md fsa:border fsa:border-amber-200 fsa:bg-amber-50 fsa:p-3 fsa:text-xs fsa:text-amber-800">
          <AlertTriangle
            className="fsa:mt-0.5 fsa:h-4 fsa:w-4 fsa:shrink-0"
            aria-hidden
          />
          <span>
            {sprintf(
              /* translators: %s: legacy SEO plugin name(s). */
              __("Deactivate %s to avoid duplicate meta tags."),
              activePlugins.map((plugin) => plugin.label).join(", "),
            )}
          </span>
        </div>
      ) : null}

      {!detect.pretty_permalinks ? (
        <div className="fsa:flex fsa:items-start fsa:gap-2 fsa:rounded-md fsa:border fsa:border-amber-200 fsa:bg-amber-50 fsa:p-3 fsa:text-xs fsa:text-amber-800">
          <AlertTriangle
            className="fsa:mt-0.5 fsa:h-4 fsa:w-4 fsa:shrink-0"
            aria-hidden
          />
          <span>
            {__(
              "Pretty permalinks are off. The sitemap and /llms.txt need them.",
            )}{" "}
            <a
              href="options-permalink.php"
              className="fsa:font-medium fsa:text-amber-800 fsa:underline"
            >
              {__("Open Permalink Settings")}
            </a>
          </span>
        </div>
      ) : null}

      <WizardFooter onBack={onBack} disabled={busy}>
        <Button type="button" onClick={onContinue} disabled={busy}>
          {__("Go to Dashboard")}
          <ArrowRight className="fsa:h-4 fsa:w-4" aria-hidden />
        </Button>
      </WizardFooter>
    </div>
  );
}

/** A small circular score dial matching the Dashboard's ScoreCard. */
function ScoreGauge({
  label,
  score,
  grade,
}: {
  label: string;
  score: number;
  grade: string;
}) {
  const tone = gradeTone(grade);
  const r = 16;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, score)) / 100) * c;

  return (
    <div className="fsa:flex fsa:flex-col fsa:items-center fsa:gap-2 fsa:rounded-xl fsa:border fsa:border-slate-200 fsa:bg-white fsa:p-4 fsa:shadow-sm">
      <div className="fsa:relative">
        <svg
          width="56"
          height="56"
          viewBox="0 0 44 44"
          className="fsa:-rotate-90"
          aria-hidden
        >
          <circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            strokeWidth="4"
            className="fsa:text-slate-100"
            stroke="currentColor"
          />
          <circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className={tone.ring}
            stroke="currentColor"
          />
        </svg>
        <span
          className={`fsa:absolute fsa:inset-0 fsa:flex fsa:items-center fsa:justify-center fsa:text-sm fsa:font-bold ${tone.text}`}
        >
          {score}
        </span>
      </div>
      <span className="fsa:text-xs fsa:font-medium fsa:text-slate-500">
        {label}
      </span>
    </div>
  );
}

/**
 * Turn the applied setting keys into human labels, preferring the recommended
 * item's own label (already localised) and falling back to the raw key.
 */
function enabledLabels(
  applied: { seo: string[]; aeo: string[] },
  recommended: { seo: RecommendedItem[]; aeo: RecommendedItem[] },
): string[] {
  const byKey = new Map<string, string>();
  for (const item of [...recommended.seo, ...recommended.aeo]) {
    byKey.set(item.key, item.label);
  }
  const keys = [...applied.seo, ...applied.aeo];
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const key of keys) {
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    labels.push(byKey.get(key) ?? key);
  }
  return labels;
}
