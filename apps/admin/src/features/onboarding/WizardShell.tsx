import { Sparkles, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { __ } from "@/lib/i18n";
import { Stepper } from "./Stepper";
import type { StepId, WizardStep } from "./useOnboarding";

interface WizardShellProps {
  onExit: () => void;
  /** When provided, the stepper renders; omitted on the loading/error states. */
  steps?: WizardStep[];
  currentId?: StepId;
  children: ReactNode;
}

/**
 * Full-screen takeover chrome for the Setup Assistant: its own brand header with
 * an always-available Exit, the step indicator, and a centered content column.
 * It renders instead of the app's tab shell (see App.tsx).
 */
export function WizardShell({
  onExit,
  steps,
  currentId,
  children,
}: WizardShellProps) {
  return (
    <div className="fsa:min-h-full fsa:bg-slate-50">
      <div className="fsa:border-b fsa:border-slate-200 fsa:bg-white">
        <div className="fsa:mx-auto fsa:flex fsa:max-w-3xl fsa:flex-wrap fsa:items-center fsa:justify-between fsa:gap-3 fsa:px-6 fsa:py-3">
          <div className="fsa:flex fsa:items-center fsa:gap-3">
            <span className="fsa:flex fsa:h-9 fsa:w-9 fsa:shrink-0 fsa:items-center fsa:justify-center fsa:rounded-lg fsa:bg-brand-500 fsa:text-white fsa:shadow-sm">
              <Sparkles className="fsa:h-5 fsa:w-5" aria-hidden />
            </span>
            <div className="fsa:text-sm fsa:font-semibold fsa:text-slate-900">
              {__("Setup Assistant")}
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="fsa:text-slate-600"
          >
            <X className="fsa:h-4 fsa:w-4" aria-hidden />
            {__("Exit setup")}
          </Button>
        </div>

        {steps && currentId ? (
          <div className="fsa:mx-auto fsa:max-w-3xl fsa:px-6 fsa:pb-3">
            <Stepper steps={steps} currentId={currentId} />
          </div>
        ) : null}
      </div>

      <main className="fsa:mx-auto fsa:max-w-3xl fsa:px-6 fsa:pt-8 fsa:pb-12">
        {children}
      </main>
    </div>
  );
}
