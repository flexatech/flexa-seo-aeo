import { Check, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { __ } from "@/lib/i18n";
import type { RecommendationState, RecommendedItem } from "./useOnboarding";

interface RecommendationListProps {
  items: RecommendedItem[];
  /** User-edited string values, keyed by setting key. */
  edits: Record<string, string>;
  onEdit: (key: string, value: string) => void;
}

const STATE_TEXT: Record<RecommendationState, string> = {
  will_enable: __("Will be enabled"),
  already_on: __("Already on"),
  user_configured_skip: __("Kept as you set it"),
};

/**
 * The recommended-settings table shared by the SEO and AEO steps. Rows are
 * read-only status, never toggles: the compare-to-defaults engine already
 * decided what is safe to change. A `will_enable` string recommendation (the
 * knowledge name, the AI summary) is the one editable case, shown inline as an
 * Input pre-filled with the recommended value. Mirrors
 * docs/onboarding-design.md §5.2 and §5.3.
 */
export function RecommendationList({
  items,
  edits,
  onEdit,
}: RecommendationListProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <ul className="fsa:divide-y fsa:divide-slate-100 fsa:rounded-xl fsa:border fsa:border-slate-200 fsa:bg-white">
        {items.map((item) => {
          const editable =
            item.state === "will_enable" &&
            typeof item.recommended === "string";
          const inputId = `fsa-rec-${item.key}`;

          return (
            <li
              key={item.key}
              className="fsa:flex fsa:items-start fsa:justify-between fsa:gap-4 fsa:px-4 fsa:py-3"
            >
              <div className="fsa:flex fsa:min-w-0 fsa:flex-1 fsa:items-start fsa:gap-3">
                <StateIcon state={item.state} />
                <div className="fsa:min-w-0 fsa:flex-1">
                  {editable ? (
                    <Label htmlFor={inputId} className="fsa:text-slate-800">
                      {item.label}
                    </Label>
                  ) : (
                    <div className="fsa:text-sm fsa:font-medium fsa:text-slate-800">
                      {item.label}
                    </div>
                  )}

                  {editable ? (
                    <Input
                      id={inputId}
                      value={edits[item.key] ?? item.recommended}
                      onChange={(event) => onEdit(item.key, event.target.value)}
                      className="fsa:mt-2"
                    />
                  ) : typeof item.recommended === "string" ? (
                    <div className="fsa:mt-1 fsa:truncate fsa:text-xs fsa:text-slate-500">
                      {String(item.current || item.recommended)}
                    </div>
                  ) : null}
                </div>
              </div>

              <StatusLabel state={item.state} />
            </li>
          );
        })}
      </ul>
    </TooltipProvider>
  );
}

function StateIcon({ state }: { state: RecommendationState }) {
  if (state === "already_on") {
    return (
      <Check
        className="fsa:mt-0.5 fsa:h-5 fsa:w-5 fsa:shrink-0 fsa:text-emerald-600"
        aria-hidden
      />
    );
  }
  if (state === "user_configured_skip") {
    return (
      <Lock
        className="fsa:mt-0.5 fsa:h-5 fsa:w-5 fsa:shrink-0 fsa:text-slate-400"
        aria-hidden
      />
    );
  }
  return (
    <span
      className="fsa:mt-1.5 fsa:h-2.5 fsa:w-2.5 fsa:shrink-0 fsa:rounded-full fsa:bg-brand-500"
      aria-hidden
    />
  );
}

function StatusLabel({ state }: { state: RecommendationState }) {
  const text = STATE_TEXT[state];
  const tone =
    state === "already_on"
      ? "fsa:text-emerald-600"
      : state === "user_configured_skip"
        ? "fsa:text-slate-400"
        : "fsa:text-brand-600";

  if (state === "user_configured_skip") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`fsa:shrink-0 fsa:whitespace-nowrap fsa:text-xs fsa:font-medium ${tone}`}
          >
            {text}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {__("This differs from the default, so we kept your value.")}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <span
      className={`fsa:shrink-0 fsa:whitespace-nowrap fsa:text-xs fsa:font-medium ${tone}`}
    >
      {text}
    </span>
  );
}
