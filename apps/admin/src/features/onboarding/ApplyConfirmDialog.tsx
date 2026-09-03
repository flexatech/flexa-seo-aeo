import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { __, sprintf } from "@/lib/i18n";
import type { RecommendedItem } from "./useOnboarding";

interface ApplyConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The will_enable items that Apply will write. */
  items: RecommendedItem[];
  /** User-edited string values, keyed by setting key. */
  edits: Record<string, string>;
  onConfirm: () => void;
  pending: boolean;
  error: string | null;
}

/**
 * The mandatory diff preview before Apply writes anything. It enumerates the
 * exact keys that will change so a re-run can never surprise the user. This is
 * the safety net for the compare-to-defaults rule (docs/onboarding-design.md
 * §4.2): Apply never fires blind.
 */
export function ApplyConfirmDialog({
  open,
  onOpenChange,
  items,
  edits,
  onConfirm,
  pending,
  error,
}: ApplyConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{__("Apply these settings?")}</DialogTitle>
          <DialogDescription>
            {sprintf(
              /* translators: %d: number of settings that will change. */
              __("%d setting(s) will change. Nothing else is touched."),
              items.length,
            )}
          </DialogDescription>
        </DialogHeader>

        <ul className="fsa:max-h-64 fsa:space-y-2 fsa:overflow-y-auto fsa:text-sm">
          {items.map((item) => {
            const value =
              typeof item.recommended === "string"
                ? (edits[item.key] ?? item.recommended)
                : null;

            return (
              <li key={item.key} className="fsa:flex fsa:items-start fsa:gap-2">
                <span
                  className="fsa:mt-1.5 fsa:h-2 fsa:w-2 fsa:shrink-0 fsa:rounded-full fsa:bg-brand-500"
                  aria-hidden
                />
                <span className="fsa:text-slate-700">
                  {item.label}
                  {value ? (
                    <span className="fsa:text-slate-400">{` → ${value}`}</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>

        {error ? (
          <div className="fsa:flex fsa:items-start fsa:gap-2 fsa:rounded-md fsa:border fsa:border-red-200 fsa:bg-red-50 fsa:p-3 fsa:text-sm fsa:text-red-700">
            <AlertTriangle
              className="fsa:mt-0.5 fsa:h-4 fsa:w-4 fsa:shrink-0"
              aria-hidden
            />
            <span>{error}</span>
          </div>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost" disabled={pending}>
              {__("Cancel")}
            </Button>
          </DialogClose>
          <Button type="button" onClick={onConfirm} disabled={pending}>
            {pending ? __("Applying…") : __("Apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
