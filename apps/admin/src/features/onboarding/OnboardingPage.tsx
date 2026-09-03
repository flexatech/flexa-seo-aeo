import { AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { __ } from "@/lib/i18n";
import { useUiStore } from "@/lib/store";
import { WizardShell } from "./WizardShell";
import {
  applicableSteps,
  type DetectPayload,
  type StepId,
  useOnboarding,
  useUpdateOnboarding,
} from "./useOnboarding";

/**
 * Interim copy per step. The interactive screens (Welcome, SEO, AEO, Content,
 * Migration, Report) land in later phases; until then each step renders its
 * heading and intent so the shell, resume, and navigation are fully exercisable.
 */
const STEP_META: Record<StepId, { title: string; description: string }> = {
  welcome: {
    title: __("Welcome"),
    description: __(
      "We detected your site setup so you don't have to fill anything in.",
    ),
  },
  seo: {
    title: __("Search essentials"),
    description: __("The SEO baseline every site needs, applied in one click."),
  },
  aeo: {
    title: __("AI readiness"),
    description: __(
      "Make your content ready to be quoted by AI answer engines.",
    ),
  },
  content: {
    title: __("Content readiness"),
    description: __("A quick scan of your top pages and what to improve."),
  },
  migration: {
    title: __("Migrate existing data"),
    description: __(
      "Bring your titles, descriptions and social settings over.",
    ),
  },
  report: {
    title: __("Readiness report"),
    description: __("Your SEO and AEO scores, and what to do next."),
  },
};

export function OnboardingPage() {
  const query = useOnboarding();
  const update = useUpdateOnboarding();
  const setView = useUiStore((s) => s.setView);
  const setupIntent = useUiStore((s) => s.setupIntent);

  const status = query.data?.state.status;
  const staleFinished =
    !setupIntent && (status === "completed" || status === "dismissed");

  // A stale persisted view:"setup" (setup already finished, and not an
  // intentional re-entry) returns to the Dashboard.
  useEffect(() => {
    if (staleFinished) {
      setView("dashboard");
    }
  }, [staleFinished, setView]);

  const exit = () => setView("dashboard");

  if (query.isLoading) {
    return (
      <WizardShell onExit={exit}>
        <div className="fsa:rounded-xl fsa:border fsa:border-slate-200 fsa:bg-white fsa:p-8 fsa:text-sm fsa:text-slate-500 fsa:shadow-sm">
          {__("Loading setup…")}
        </div>
      </WizardShell>
    );
  }

  if (query.isError || !query.data) {
    return (
      <WizardShell onExit={exit}>
        <div className="fsa:rounded-xl fsa:border fsa:border-red-200 fsa:bg-red-50 fsa:p-6 fsa:shadow-sm">
          <div className="fsa:flex fsa:items-start fsa:gap-3">
            <AlertTriangle
              className="fsa:mt-0.5 fsa:h-5 fsa:w-5 fsa:shrink-0 fsa:text-red-600"
              aria-hidden
            />
            <div className="fsa:space-y-3">
              <p className="fsa:text-sm fsa:text-red-700">
                {__("We couldn't load the Setup Assistant.")}{" "}
                {(query.error as Error)?.message ?? __("Unknown error.")}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void query.refetch()}
              >
                {__("Retry")}
              </Button>
            </div>
          </div>
        </div>
      </WizardShell>
    );
  }

  // Redirecting away (effect above) — render nothing to avoid a flash.
  if (staleFinished) {
    return null;
  }

  const { state, detect } = query.data;
  const steps = applicableSteps(detect);
  const stepIds = steps.map((step) => step.id);

  // Resume on the server-recorded step, clamped to one that still applies.
  const current: StepId = stepIds.includes(state.current_step)
    ? state.current_step
    : "welcome";
  const index = stepIds.indexOf(current);
  const isFirst = index <= 0;
  const isLast = index >= stepIds.length - 1;

  const goTo = (step: StepId, completed?: StepId[]) => {
    update.mutate({
      status: "in_progress",
      current_step: step,
      ...(completed ? { completed_steps: completed } : {}),
    });
  };

  const onBack = () => {
    if (!isFirst) {
      goTo(stepIds[index - 1]);
    }
  };

  const onNext = () => {
    const completed = [...state.completed_steps, current];
    goTo(stepIds[index + 1], completed);
  };

  const onFinish = () => {
    update.mutate(
      {
        status: "completed",
        completed_steps: [...state.completed_steps, current],
      },
      { onSuccess: () => setView("dashboard") },
    );
  };

  const meta = STEP_META[current];

  return (
    <WizardShell steps={steps} currentId={current} onExit={exit}>
      <div className="fsa:space-y-6">
        <div className="fsa:rounded-xl fsa:border fsa:border-slate-200 fsa:bg-white fsa:p-8 fsa:shadow-sm">
          <h1 className="fsa:text-2xl fsa:font-bold fsa:text-slate-900">
            {meta.title}
          </h1>
          <p className="fsa:mt-2 fsa:text-sm fsa:text-slate-600">
            {meta.description}
          </p>
          <StepDetails step={current} detect={detect} />
        </div>

        <div className="fsa:flex fsa:items-center fsa:justify-between">
          <div>
            {!isFirst && (
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                disabled={update.isPending}
              >
                <ArrowLeft className="fsa:h-4 fsa:w-4" aria-hidden />
                {__("Back")}
              </Button>
            )}
          </div>

          <Button
            type="button"
            onClick={isLast ? onFinish : onNext}
            disabled={update.isPending}
          >
            {isLast
              ? __("Go to Dashboard")
              : isFirst
                ? __("Start setup")
                : __("Continue")}
            {!isLast && <ArrowRight className="fsa:h-4 fsa:w-4" aria-hidden />}
          </Button>
        </div>
      </div>
    </WizardShell>
  );
}

/**
 * A small, read-only snapshot of the detection relevant to the current step, so
 * the interim screen already reflects the real site. Interactive controls arrive
 * with each step's dedicated component in later phases.
 */
function StepDetails({
  step,
  detect,
}: {
  step: StepId;
  detect: DetectPayload;
}) {
  if (step !== "welcome") {
    return null;
  }

  const rows: { label: string; value: string }[] = [
    { label: __("Site"), value: detect.site_name || detect.site_url },
    { label: __("Language"), value: detect.language },
    {
      label: __("Type"),
      value: detect.has_woocommerce
        ? __("WooCommerce store")
        : detect.site_type,
    },
  ];

  return (
    <dl className="fsa:mt-6 fsa:grid fsa:gap-2 fsa:rounded-lg fsa:bg-slate-50 fsa:p-4 fsa:text-sm">
      {rows.map((row) => (
        <div key={row.label} className="fsa:flex fsa:justify-between fsa:gap-4">
          <dt className="fsa:text-slate-500">{row.label}</dt>
          <dd className="fsa:font-medium fsa:text-slate-800">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
