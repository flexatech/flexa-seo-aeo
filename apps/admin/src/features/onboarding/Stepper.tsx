import { Fragment } from "react";
import { cn } from "@/lib/cn";
import { __, sprintf } from "@/lib/i18n";
import type { StepId, WizardStep } from "./useOnboarding";

interface StepperProps {
  steps: WizardStep[];
  currentId: StepId;
}

/**
 * The wizard progress indicator: a row of dots (done / active / upcoming) with
 * labels on wider screens, plus a "Step X of N · Label" line for small screens
 * and screen readers.
 */
export function Stepper({ steps, currentId }: StepperProps) {
  const index = Math.max(
    0,
    steps.findIndex((step) => step.id === currentId),
  );
  const current = steps[index];

  return (
    <div className="fsa:space-y-2">
      <ol className="fsa:flex fsa:items-center fsa:gap-2">
        {steps.map((step, i) => {
          const done = i < index;
          const active = i === index;
          return (
            <Fragment key={step.id}>
              <li
                aria-current={active ? "step" : undefined}
                className="fsa:flex fsa:items-center fsa:gap-2"
              >
                <span
                  className={cn(
                    "fsa:h-2.5 fsa:w-2.5 fsa:shrink-0 fsa:rounded-full fsa:transition-colors",
                    done && "fsa:bg-brand-600",
                    active && "fsa:bg-brand-600 fsa:ring-2 fsa:ring-brand-200",
                    !done && !active && "fsa:bg-slate-300",
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "fsa:hidden fsa:text-xs fsa:font-medium fsa:sm:inline",
                    active ? "fsa:text-brand-700" : "fsa:text-slate-500",
                  )}
                >
                  {step.label}
                </span>
              </li>
              {i < steps.length - 1 && (
                <span
                  className="fsa:h-px fsa:w-6 fsa:bg-slate-200"
                  aria-hidden
                />
              )}
            </Fragment>
          );
        })}
      </ol>
      <p className="fsa:text-xs fsa:text-slate-500">
        {sprintf(
          /* translators: 1: current step number, 2: total steps. */
          __("Step %1$d of %2$d"),
          index + 1,
          steps.length,
        )}
        {current ? ` · ${current.label}` : ""}
      </p>
    </div>
  );
}
