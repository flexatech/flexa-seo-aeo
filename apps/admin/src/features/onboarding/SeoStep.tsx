import { __ } from "@/lib/i18n";
import { RecommendedScopeStep } from "./RecommendedScopeStep";
import type { StepProps } from "./useOnboarding";

/**
 * Screen 2: SEO Recommended Setup. The baseline every site needs, applied in one
 * click. Mirrors docs/onboarding-design.md §5.2.
 */
export function SeoStep({ recommended, onContinue, onBack, busy }: StepProps) {
  return (
    <RecommendedScopeStep
      scope="seo"
      step="seo"
      title={__("Search essentials")}
      description={__("The baseline every site needs. One click.")}
      applyLabel={__("Apply recommended settings")}
      appliedToast={__("Search essentials enabled.")}
      items={recommended.seo}
      onContinue={onContinue}
      onBack={onBack}
      busy={busy}
    />
  );
}
