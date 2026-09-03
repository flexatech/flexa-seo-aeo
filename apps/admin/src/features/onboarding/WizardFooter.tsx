import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { __ } from "@/lib/i18n";

interface WizardFooterProps {
  /** Hidden on the first step. */
  onBack?: () => void;
  disabled?: boolean;
  /** Right-aligned actions: secondary buttons first, then the primary. */
  children: ReactNode;
}

/** The consistent Back / actions row every step renders below its card. */
export function WizardFooter({
  onBack,
  disabled,
  children,
}: WizardFooterProps) {
  return (
    <div className="fsa:flex fsa:items-center fsa:justify-between fsa:gap-3">
      <div>
        {onBack ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={disabled}
          >
            <ArrowLeft className="fsa:h-4 fsa:w-4" aria-hidden />
            {__("Back")}
          </Button>
        ) : null}
      </div>
      <div className="fsa:flex fsa:items-center fsa:gap-2">{children}</div>
    </div>
  );
}
