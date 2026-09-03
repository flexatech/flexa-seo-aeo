import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RecommendedItem, StepId } from "./useOnboarding";

export type ApplyScope = "seo" | "aeo";

/** The items Apply will actually write: only those still off-by-default. */
export function pendingItems(items: RecommendedItem[]): RecommendedItem[] {
  return items.filter((item) => item.state === "will_enable");
}

/**
 * Build the minimal partial `/settings` payload from the will_enable items,
 * folding any user-edited string value (keyed by setting key) over the
 * recommended one. `aeo.*` keys collapse into a nested `aeo` object; the server
 * sanitizer merges that partial group over what is stored. Mirrors
 * docs/onboarding-design.md §4.3.
 */
export function buildApplyPayload(
  items: RecommendedItem[],
  edits: Record<string, string>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const aeo: Record<string, unknown> = {};

  for (const item of pendingItems(items)) {
    const value =
      typeof item.recommended === "string"
        ? (edits[item.key] ?? item.recommended)
        : item.recommended;

    if (item.key.startsWith("aeo.")) {
      aeo[item.key.slice(4)] = value;
    } else {
      payload[item.key] = value;
    }
  }

  if (Object.keys(aeo).length > 0) {
    payload.aeo = aeo;
  }

  return payload;
}

/**
 * Apply one scope's recommended settings. The write goes through the existing
 * `POST /settings` (a single sanitize/merge path that fires
 * `flexa_seo_aeo/settings/updated`), then a `POST /onboarding` records the
 * changed keys under `applied.{scope}` and marks the step complete. The two
 * calls are not atomic; the server unions `applied`/`completed_steps`, so a lost
 * second call only re-shows a finished step as current, which resume handles.
 *
 * On success both `["settings"]` and `["onboarding"]` are invalidated, so the
 * refetched recommendations flip the applied rows to `already_on` and the step
 * re-renders all-green without any local "applied" flag.
 */
export function useApplyScope() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      scope: ApplyScope;
      step: StepId;
      payload: Record<string, unknown>;
      keys: string[];
    }) => {
      await api.post("settings", vars.payload);
      await api.post("onboarding", {
        status: "in_progress",
        applied: { [vars.scope]: vars.keys },
        completed_steps: [vars.step],
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["settings"] });
      void qc.invalidateQueries({ queryKey: ["onboarding"] });
    },
  });
}
