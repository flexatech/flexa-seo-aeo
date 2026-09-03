import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { __ } from "@/lib/i18n";
import { useUiStore } from "@/lib/store";
import { AeoStep } from "./AeoStep";
import { ContentStep } from "./ContentStep";
import { MigrationStep } from "./MigrationStep";
import { ReportStep } from "./ReportStep";
import { SeoStep } from "./SeoStep";
import { WelcomeStep } from "./WelcomeStep";
import { WizardShell } from "./WizardShell";
import {
  applicableSteps,
  type StepId,
  type StepProps,
  useOnboarding,
  useUpdateOnboarding,
} from "./useOnboarding";

export function OnboardingPage() {
  const query = useOnboarding();
  const update = useUpdateOnboarding();
  const setView = useUiStore((s) => s.setView);
  const setupIntent = useUiStore((s) => s.setupIntent);

  // On each step change, move focus to the top of the fresh step so keyboard
  // and screen-reader users land on the new heading rather than a stale button.
  const stepRef = useRef<HTMLDivElement>(null);
  const activeStep = query.data?.state.current_step;
  useEffect(() => {
    stepRef.current?.focus();
  }, [activeStep]);

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

  const { state, detect, recommended } = query.data;
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

  const onFinish = () => {
    update.mutate(
      {
        status: "completed",
        completed_steps: [...state.completed_steps, current],
      },
      { onSuccess: () => setView("dashboard") },
    );
  };

  const onContinue = () => {
    if (isLast) {
      onFinish();
      return;
    }
    goTo(stepIds[index + 1], [...state.completed_steps, current]);
  };

  const stepProps: StepProps = {
    detect,
    state,
    recommended,
    onContinue,
    onBack: isFirst ? undefined : onBack,
    onFinish,
    busy: update.isPending,
  };

  return (
    <WizardShell steps={steps} currentId={current} onExit={exit}>
      <div ref={stepRef} tabIndex={-1} className="fsa:outline-none">
        {current === "welcome" ? (
          <WelcomeStep {...stepProps} />
        ) : current === "seo" ? (
          <SeoStep {...stepProps} />
        ) : current === "aeo" ? (
          <AeoStep {...stepProps} />
        ) : current === "content" ? (
          <ContentStep {...stepProps} />
        ) : current === "migration" ? (
          <MigrationStep {...stepProps} />
        ) : (
          <ReportStep {...stepProps} />
        )}
      </div>
    </WizardShell>
  );
}
