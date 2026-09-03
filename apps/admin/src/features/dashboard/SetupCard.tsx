import { ArrowRight, CheckCircle2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pendingItems } from "@/features/onboarding/useApply";
import {
  completionPercent,
  useOnboarding,
  useUpdateOnboarding,
} from "@/features/onboarding/useOnboarding";
import { __, sprintf } from "@/lib/i18n";
import { useUiStore } from "@/lib/store";

/**
 * The Setup Assistant entry card at the top of the Dashboard. It reflects the
 * onboarding state (pending / in progress / complete) and is the main re-entry
 * point into the wizard. Rendered only for users who can manage settings; the
 * caller gates on `canManageSettings`, so editors never fetch `/onboarding`.
 * Mirrors docs/onboarding-design.md §8.1.
 */
export function SetupCard() {
  const query = useOnboarding();
  const update = useUpdateOnboarding();
  const openSetup = useUiStore((s) => s.openSetup);

  // Never block the Dashboard: while loading or on error, render nothing.
  if (!query.data) {
    return null;
  }

  const { state, detect, recommended } = query.data;

  if (state.status === "dismissed") {
    return null;
  }

  const remaining =
    pendingItems(recommended.seo).length + pendingItems(recommended.aeo).length;
  const pct = completionPercent(state, detect);

  const dismiss = () => update.mutate({ status: "dismissed" });

  // Completed, nothing left to enable: a single compact confirmation row.
  if (state.status === "completed" && remaining === 0) {
    return (
      <Shell>
        <div className="fsa:flex fsa:items-center fsa:gap-2 fsa:text-sm fsa:font-medium fsa:text-slate-700">
          <CheckCircle2
            className="fsa:h-4 fsa:w-4 fsa:text-emerald-600"
            aria-hidden
          />
          {__("Setup complete.")}
        </div>
        <DismissButton onClick={dismiss} disabled={update.isPending} />
      </Shell>
    );
  }

  // Completed but some recommended settings are still off.
  if (state.status === "completed") {
    return (
      <Shell>
        <div className="fsa:min-w-0">
          <div className="fsa:text-sm fsa:font-semibold fsa:text-slate-900">
            {__("Setup complete.")}
          </div>
          <p className="fsa:text-xs fsa:text-slate-500">
            {sprintf(
              /* translators: %d: number of recommended settings still off. */
              __("%d recommended setting(s) still off."),
              remaining,
            )}
          </p>
        </div>
        <div className="fsa:flex fsa:items-center fsa:gap-2">
          <Button type="button" variant="outline" size="sm" onClick={openSetup}>
            {__("Review")}
          </Button>
          <DismissButton onClick={dismiss} disabled={update.isPending} />
        </div>
      </Shell>
    );
  }

  // In progress: show the completion bar and a resume button.
  if (state.status === "in_progress") {
    return (
      <Shell>
        <div className="fsa:min-w-0 fsa:flex-1">
          <div className="fsa:flex fsa:items-center fsa:gap-2 fsa:text-sm fsa:font-semibold fsa:text-slate-900">
            <Sparkles
              className="fsa:h-4 fsa:w-4 fsa:text-brand-600"
              aria-hidden
            />
            {sprintf(
              /* translators: %d: completion percentage. */
              __("Setup %d%% complete"),
              pct,
            )}
          </div>
          <p className="fsa:mt-0.5 fsa:text-xs fsa:text-slate-500">
            {remaining > 0
              ? sprintf(
                  /* translators: %d: number of recommended actions remaining. */
                  __("%d recommended action(s) remaining"),
                  remaining,
                )
              : __("Pick up where you left off.")}
          </p>
          <div className="fsa:mt-2 fsa:h-1.5 fsa:w-full fsa:max-w-xs fsa:overflow-hidden fsa:rounded-full fsa:bg-slate-100">
            <div
              className="fsa:h-full fsa:rounded-full fsa:bg-brand-600 fsa:transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={openSetup}
          className="fsa:gap-1.5"
        >
          {__("Resume setup")}
          <ArrowRight className="fsa:h-4 fsa:w-4" aria-hidden />
        </Button>
      </Shell>
    );
  }

  // Pending: the first-run invitation.
  return (
    <Shell>
      <div className="fsa:min-w-0 fsa:flex-1">
        <div className="fsa:flex fsa:items-center fsa:gap-2 fsa:text-sm fsa:font-semibold fsa:text-slate-900">
          <Sparkles
            className="fsa:h-4 fsa:w-4 fsa:text-brand-600"
            aria-hidden
          />
          {__("Set up Flexa SEO in 3 minutes.")}
        </div>
        <p className="fsa:mt-0.5 fsa:text-xs fsa:text-slate-500">
          {__("Detect, recommend, one click. AEO included.")}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={openSetup}
        className="fsa:gap-1.5"
      >
        {__("Start Setup Assistant")}
        <ArrowRight className="fsa:h-4 fsa:w-4" aria-hidden />
      </Button>
    </Shell>
  );
}

/** The shared card frame: standard tokens plus a brand-tinted left border. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fsa:mb-4 fsa:flex fsa:flex-wrap fsa:items-center fsa:justify-between fsa:gap-3 fsa:rounded-xl fsa:border fsa:border-slate-200 fsa:border-l-4 fsa:border-l-brand-500 fsa:bg-white fsa:px-5 fsa:py-4 fsa:shadow-sm">
      {children}
    </div>
  );
}

function DismissButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={__("Dismiss setup card")}
      className="fsa:shrink-0 fsa:rounded fsa:p-1 fsa:text-slate-400 fsa:transition-colors fsa:cursor-pointer fsa:hover:bg-slate-100 fsa:hover:text-slate-600 fsa:disabled:opacity-50"
    >
      <X className="fsa:h-4 fsa:w-4" aria-hidden />
    </button>
  );
}
