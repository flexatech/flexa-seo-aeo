import { useQuery } from "@tanstack/react-query";
import { Bot, Gauge } from "lucide-react";
import { rescanPage } from "@/features/dashboard/useDashboard";
import { __, sprintf } from "@/lib/i18n";
import { pendingItems } from "./useApply";
import { RecommendedScopeStep } from "./RecommendedScopeStep";
import type { StepProps } from "./useOnboarding";

/**
 * Screen 3: AEO Setup, the differentiator. Same Apply pattern as the SEO step,
 * scoped to `recommended.aeo`, plus a live readiness preview of the latest post
 * once AEO scoring is on. Mirrors docs/onboarding-design.md §5.3.
 */
export function AeoStep({
  detect,
  recommended,
  onContinue,
  onBack,
  busy,
}: StepProps) {
  // Preview only makes sense once scoring is actually on (nothing left to
  // enable) and there is a post to score.
  const aeoOn = pendingItems(recommended.aeo).length === 0;
  const showPreview =
    aeoOn && detect.posts_published > 0 && detect.latest_post_id !== null;

  return (
    <RecommendedScopeStep
      scope="aeo"
      step="aeo"
      title={__("Make your content ready for AI answers")}
      description={__("Prepared in one click, then measured per post.")}
      intro={__(
        "ChatGPT, Perplexity and Google AI Overviews read sites differently. Flexa prepares yours, then measures how quotable each post is.",
      )}
      applyLabel={__("Enable AEO features")}
      appliedToast={__("AEO features enabled.")}
      items={recommended.aeo}
      onContinue={onContinue}
      onBack={onBack}
      busy={busy}
    >
      {showPreview && detect.latest_post_id !== null ? (
        <AeoPreview postId={detect.latest_post_id} />
      ) : null}
    </RecommendedScopeStep>
  );
}

/**
 * A self-contained, non-blocking preview: it fetches the existing per-post
 * readiness report and renders a mini score card. Any error or slow response is
 * silently omitted; it never blocks Continue.
 */
function AeoPreview({ postId }: { postId: number }) {
  const preview = useQuery({
    queryKey: ["readiness", postId],
    queryFn: () => rescanPage(postId),
    staleTime: 60_000,
    retry: false,
  });

  if (preview.isLoading) {
    return (
      <div className="fsa:flex fsa:items-center fsa:gap-2 fsa:rounded-xl fsa:border fsa:border-slate-200 fsa:bg-white fsa:p-4 fsa:text-sm fsa:text-slate-500">
        <Gauge className="fsa:h-4 fsa:w-4 fsa:shrink-0" aria-hidden />
        {__("Scoring your latest post…")}
      </div>
    );
  }

  if (preview.isError || !preview.data) {
    return null;
  }

  return (
    <div className="fsa:flex fsa:items-start fsa:gap-3 fsa:rounded-xl fsa:border fsa:border-brand-100 fsa:bg-brand-50 fsa:p-4">
      <Bot
        className="fsa:mt-0.5 fsa:h-5 fsa:w-5 fsa:shrink-0 fsa:text-brand-600"
        aria-hidden
      />
      <div className="fsa:text-sm fsa:text-slate-700">
        <span className="fsa:font-semibold fsa:text-slate-900">
          {sprintf(
            /* translators: %d: readiness score out of 100. */
            __("Your latest post scores %d/100 for AI answers."),
            preview.data.score,
          )}
        </span>{" "}
        {__("We'll scan more of your content next.")}
      </div>
    </div>
  );
}
