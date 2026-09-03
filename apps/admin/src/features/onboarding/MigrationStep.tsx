import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  DatabaseZap,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  type MigrationProgress,
  runMigration,
  useMigrationSources,
} from "@/features/settings/useMigration";
import { __, sprintf } from "@/lib/i18n";
import { useUiStore } from "@/lib/store";
import type { StepProps } from "./useOnboarding";
import { WizardFooter } from "./WizardFooter";

interface RunState {
  progress?: MigrationProgress;
  done?: MigrationProgress;
  error?: string;
}

/**
 * Screen 5 (conditional): Migration. Reuses the exact machinery behind the
 * Settings migration pane (the shared `useMigration` hook and `/migrate`
 * routes), presented as a wizard step. Skip or Continue both advance and mark
 * the step done; the pane in Settings stays the permanent home for re-runs.
 * Mirrors docs/onboarding-design.md §5.5.
 */
export function MigrationStep({ onContinue, onBack, busy }: StepProps) {
  const { data: sources, isLoading, isError } = useMigrationSources();
  const showToast = useUiStore((s) => s.showToast);

  const [overwrite, setOverwrite] = useState<Record<string, boolean>>({});
  const [runs, setRuns] = useState<Record<string, RunState>>({});
  const [running, setRunning] = useState<string | null>(null);

  const available = (sources ?? []).filter((source) => source.available);
  const anyDone = Object.values(runs).some((run) => run.done);
  const locked = busy || running !== null;

  const onMigrate = async (id: string, label: string) => {
    setRunning(id);
    setRuns((r) => ({ ...r, [id]: { progress: undefined } }));
    try {
      const final = await runMigration(id, Boolean(overwrite[id]), (progress) =>
        setRuns((r) => ({ ...r, [id]: { progress } })),
      );
      setRuns((r) => ({ ...r, [id]: { done: final } }));
      showToast(
        sprintf(
          /* translators: 1: source label, 2: migrated count, 3: skipped count. */
          __("%1$s: migrated %2$d, skipped %3$d."),
          label,
          final.migrated,
          final.skipped,
        ),
      );
    } catch (err) {
      setRuns((r) => ({ ...r, [id]: { error: (err as Error).message } }));
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="fsa:space-y-6">
      <div className="fsa:space-y-2">
        <h1 className="fsa:text-2xl fsa:font-bold fsa:text-slate-900">
          {__("Bring your existing SEO data over")}
        </h1>
        <p className="fsa:text-sm fsa:text-slate-600">
          {__(
            "Titles, descriptions, canonical URLs and social tags from your old plugin. Fill-gaps keeps anything Flexa already has.",
          )}
        </p>
      </div>

      {isLoading ? (
        <p className="fsa:text-sm fsa:text-slate-500">
          {__("Scanning for existing SEO data…")}
        </p>
      ) : null}

      {isError ? (
        <p className="fsa:text-sm fsa:text-red-700">
          {__("Could not read migration sources.")}
        </p>
      ) : null}

      {!isLoading && !isError && available.length === 0 ? (
        <p className="fsa:text-sm fsa:text-slate-500">
          {__("No importable data found. You can skip this step.")}
        </p>
      ) : null}

      {available.map((source) => {
        const run = runs[source.id];
        const isThisRunning = running === source.id;
        const pct =
          run?.progress && run.progress.total > 0
            ? Math.round((run.progress.processed / run.progress.total) * 100)
            : 0;

        return (
          <div
            key={source.id}
            className="fsa:rounded-xl fsa:border fsa:border-slate-200 fsa:bg-white fsa:p-4 fsa:shadow-sm"
          >
            <div className="fsa:flex fsa:items-start fsa:gap-3">
              <span className="fsa:flex fsa:h-9 fsa:w-9 fsa:shrink-0 fsa:items-center fsa:justify-center fsa:rounded-lg fsa:bg-brand-50 fsa:text-brand-600">
                <DatabaseZap className="fsa:h-4 fsa:w-4" aria-hidden />
              </span>
              <div className="fsa:min-w-0 fsa:flex-1">
                <div className="fsa:text-sm fsa:font-semibold fsa:text-slate-900">
                  {source.label}
                </div>
                <p className="fsa:text-xs fsa:text-slate-500">
                  {sprintf(
                    /* translators: %d: number of posts with data. */
                    __("%d post(s) with data to import."),
                    source.count,
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                disabled={locked}
                onClick={() => onMigrate(source.id, source.label)}
                className="fsa:shrink-0 fsa:gap-2"
              >
                {isThisRunning ? (
                  <Loader2
                    className="fsa:h-4 fsa:w-4 fsa:animate-spin"
                    aria-hidden
                  />
                ) : (
                  <DatabaseZap className="fsa:h-4 fsa:w-4" aria-hidden />
                )}
                {isThisRunning ? __("Migrating…") : __("Migrate")}
              </Button>
            </div>

            <label className="fsa:mt-3 fsa:flex fsa:items-center fsa:gap-2 fsa:text-xs fsa:text-slate-600">
              <Switch
                checked={Boolean(overwrite[source.id])}
                disabled={locked}
                onCheckedChange={(next) =>
                  setOverwrite((o) => ({ ...o, [source.id]: next }))
                }
              />
              {__("Overwrite existing Flexa values")}
            </label>

            {run?.progress && !run.done ? (
              <div className="fsa:mt-3">
                <div className="fsa:h-1.5 fsa:w-full fsa:overflow-hidden fsa:rounded-full fsa:bg-slate-100">
                  <div
                    className="fsa:h-full fsa:rounded-full fsa:bg-brand-600 fsa:transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="fsa:mt-1 fsa:text-xs fsa:text-slate-500">
                  {sprintf(
                    /* translators: 1: processed count, 2: total. */
                    __("%1$d / %2$d processed"),
                    run.progress.processed,
                    run.progress.total,
                  )}
                </p>
              </div>
            ) : null}

            {run?.done ? (
              <p className="fsa:mt-3 fsa:flex fsa:items-center fsa:gap-1.5 fsa:text-xs fsa:text-emerald-700">
                <CheckCircle2 className="fsa:h-4 fsa:w-4" aria-hidden />
                {sprintf(
                  /* translators: 1: migrated count, 2: skipped count. */
                  __("Done. Migrated %1$d, skipped %2$d."),
                  run.done.migrated,
                  run.done.skipped,
                )}
              </p>
            ) : null}

            {run?.error ? (
              <p className="fsa:mt-3 fsa:flex fsa:items-start fsa:gap-1.5 fsa:text-xs fsa:text-red-700">
                <AlertTriangle
                  className="fsa:mt-0.5 fsa:h-4 fsa:w-4 fsa:shrink-0"
                  aria-hidden
                />
                <span>{run.error}</span>
              </p>
            ) : null}
          </div>
        );
      })}

      <p className="fsa:text-xs fsa:text-slate-500">
        {__(
          "You can always run this later from Settings → Tools. Back up your database before a large import.",
        )}
      </p>

      <WizardFooter onBack={onBack} disabled={locked}>
        <Button type="button" onClick={onContinue} disabled={locked}>
          {anyDone ? __("Continue") : __("Skip for now")}
          {anyDone ? (
            <ArrowRight className="fsa:h-4 fsa:w-4" aria-hidden />
          ) : null}
        </Button>
      </WizardFooter>
    </div>
  );
}
