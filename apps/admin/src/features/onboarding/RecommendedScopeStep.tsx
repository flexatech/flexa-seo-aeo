import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { __ } from "@/lib/i18n";
import { useUiStore } from "@/lib/store";
import { ApplyConfirmDialog } from "./ApplyConfirmDialog";
import { RecommendationList } from "./RecommendationList";
import type { RecommendedItem, StepId } from "./useOnboarding";
import { buildApplyPayload, pendingItems, useApplyScope } from "./useApply";
import { WizardFooter } from "./WizardFooter";

interface RecommendedScopeStepProps {
  scope: "seo" | "aeo";
  step: StepId;
  title: string;
  description: string;
  /** Optional lead paragraph above the list (the AEO differentiator copy). */
  intro?: ReactNode;
  /** The primary Apply label, e.g. "Apply recommended settings". */
  applyLabel: string;
  /** Toast copy shown after a successful Apply. */
  appliedToast: string;
  /** Rendered below the list (e.g. the AEO live-preview card). */
  children?: ReactNode;
  items: RecommendedItem[];
  onContinue: () => void;
  onBack?: () => void;
  busy: boolean;
}

/**
 * The shared engine behind the SEO and AEO steps: a read-only recommendation
 * list, a diff-confirm Apply that writes through `POST /settings`, and a footer
 * whose primary flips from Apply to Continue once nothing is left to enable.
 * See docs/onboarding-design.md §5.2 and §5.3.
 */
export function RecommendedScopeStep({
  scope,
  step,
  title,
  description,
  intro,
  applyLabel,
  appliedToast,
  children,
  items,
  onContinue,
  onBack,
  busy,
}: RecommendedScopeStepProps) {
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const apply = useApplyScope();
  const showToast = useUiStore((s) => s.showToast);

  const pending = pendingItems(items);
  const hasPending = pending.length > 0;

  const onEdit = (key: string, value: string) =>
    setEdits((prev) => ({ ...prev, [key]: value }));

  const confirmApply = () => {
    apply.mutate(
      {
        scope,
        step,
        payload: buildApplyPayload(items, edits),
        keys: pending.map((item) => item.key),
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          showToast(appliedToast, "success");
        },
        onError: (error) => {
          showToast(
            (error as Error)?.message ?? __("Something went wrong."),
            "error",
          );
        },
      },
    );
  };

  return (
    <div className="fsa:space-y-6">
      <div className="fsa:space-y-2">
        <h1 className="fsa:text-2xl fsa:font-bold fsa:text-slate-900">
          {title}
        </h1>
        <p className="fsa:text-sm fsa:text-slate-600">{description}</p>
      </div>

      {intro ? (
        <div className="fsa:rounded-xl fsa:border fsa:border-brand-100 fsa:bg-brand-50 fsa:p-4 fsa:text-sm fsa:text-slate-700">
          {intro}
        </div>
      ) : null}

      <RecommendationList items={items} edits={edits} onEdit={onEdit} />

      {!hasPending ? (
        <div className="fsa:flex fsa:items-center fsa:gap-2 fsa:rounded-md fsa:border fsa:border-emerald-200 fsa:bg-emerald-50 fsa:p-3 fsa:text-sm fsa:text-emerald-700">
          <CheckCircle2 className="fsa:h-4 fsa:w-4 fsa:shrink-0" aria-hidden />
          {__("Everything recommended is already enabled.")}
        </div>
      ) : null}

      {children}

      <WizardFooter onBack={onBack} disabled={busy || apply.isPending}>
        {hasPending ? (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={onContinue}
              disabled={busy || apply.isPending}
            >
              {__("Skip for now")}
            </Button>
            <Button
              type="button"
              onClick={() => setDialogOpen(true)}
              disabled={busy || apply.isPending}
            >
              <Sparkles className="fsa:h-4 fsa:w-4" aria-hidden />
              {applyLabel}
            </Button>
          </>
        ) : (
          <Button type="button" onClick={onContinue} disabled={busy}>
            {__("Continue")}
            <ArrowRight className="fsa:h-4 fsa:w-4" aria-hidden />
          </Button>
        )}
      </WizardFooter>

      <ApplyConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        items={pending}
        edits={edits}
        onConfirm={confirmApply}
        pending={apply.isPending}
        error={apply.isError ? ((apply.error as Error)?.message ?? null) : null}
      />
    </div>
  );
}
