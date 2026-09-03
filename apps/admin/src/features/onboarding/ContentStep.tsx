import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { __, sprintf } from "@/lib/i18n";
import type { StepProps } from "./useOnboarding";
import {
  bucketOf,
  type ScanBucket,
  type ScanItem,
  useContentScan,
} from "./useContentScan";
import { WizardFooter } from "./WizardFooter";

/** How many low-scoring pages the attention table ever lists. */
const TOP_PAGES = 5;

/**
 * Screen 4: Content Readiness. The screen renders instantly with a progress
 * shell; the scan fires in the background (see useContentScan) and results
 * accumulate live into the bucket counters and the attention table. Nothing is
 * written, so Skip just stops the loop. Mirrors docs/onboarding-design.md §5.4.
 */
export function ContentStep({ onContinue, onBack, busy }: StepProps) {
  const scan = useContentScan();
  const scanning = scan.status === "scanning";

  const buckets = countBuckets(scan.items);
  const average =
    scan.items.length > 0
      ? Math.round(
          scan.items.reduce((sum, item) => sum + item.score, 0) /
            scan.items.length,
        )
      : 0;

  const topPages = [...scan.items]
    .sort((a, b) => a.score - b.score)
    .slice(0, TOP_PAGES);

  const proceed = () => {
    scan.abort();
    onContinue();
  };

  return (
    <div className="fsa:space-y-6">
      <div className="fsa:space-y-2">
        <h1 className="fsa:text-2xl fsa:font-bold fsa:text-slate-900">
          {__("How ready is your content?")}
        </h1>
        <p className="fsa:text-sm fsa:text-slate-600">
          {__(
            "A quick read of your most recent pages. This only measures, it changes nothing.",
          )}
        </p>
      </div>

      {scanning ? (
        <ScanProgress scanned={scan.scanned} total={scan.total} />
      ) : null}

      {scan.items.length > 0 ? (
        <div className="fsa:space-y-4 fsa:rounded-xl fsa:border fsa:border-slate-200 fsa:bg-white fsa:p-5 fsa:shadow-sm">
          <div className="fsa:flex fsa:flex-wrap fsa:items-center fsa:justify-between fsa:gap-3">
            <div>
              <div className="fsa:text-xs fsa:font-medium fsa:uppercase fsa:tracking-wide fsa:text-slate-400">
                {__("Overall readiness")}
              </div>
              <div className="fsa:text-2xl fsa:font-bold fsa:text-slate-900">
                {sprintf(
                  /* translators: %d: average readiness score out of 100. */
                  __("%d / 100"),
                  average,
                )}
              </div>
            </div>
            <div className="fsa:flex fsa:flex-wrap fsa:gap-2">
              <BucketChip bucket="good" count={buckets.good} />
              <BucketChip bucket="needs" count={buckets.needs} />
              <BucketChip bucket="poor" count={buckets.poor} />
            </div>
          </div>

          {topPages.length > 0 ? (
            <div className="fsa:overflow-hidden fsa:rounded-lg fsa:border fsa:border-slate-100">
              <div className="fsa:border-b fsa:border-slate-100 fsa:bg-slate-50 fsa:px-3 fsa:py-2 fsa:text-xs fsa:font-medium fsa:text-slate-500">
                {__("Top pages needing attention")}
              </div>
              <ul className="fsa:divide-y fsa:divide-slate-100">
                {topPages.map((item) => (
                  <li
                    key={item.id}
                    className="fsa:flex fsa:items-center fsa:gap-3 fsa:px-3 fsa:py-2"
                  >
                    <ScoreChip
                      score={item.score}
                      bucket={bucketOf(item.grade)}
                    />
                    <span className="fsa:min-w-0 fsa:flex-1 fsa:truncate fsa:text-sm fsa:text-slate-800">
                      {item.title || __("(no title)")}
                    </span>
                    {item.worst_check ? (
                      <span className="fsa:shrink-0 fsa:truncate fsa:text-xs fsa:text-slate-500">
                        {item.worst_check}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="fsa:text-xs fsa:text-slate-500">
            {__(
              "You'll fix these from the Dashboard after setup. Each has one-click patches.",
            )}
          </p>
        </div>
      ) : null}

      {scan.status === "error" ? (
        <div className="fsa:flex fsa:items-start fsa:gap-2 fsa:rounded-md fsa:border fsa:border-amber-200 fsa:bg-amber-50 fsa:p-3 fsa:text-xs fsa:text-amber-800">
          <AlertTriangle
            className="fsa:mt-0.5 fsa:h-4 fsa:w-4 fsa:shrink-0"
            aria-hidden
          />
          <span>{__("Scan incomplete. Retry from the Dashboard.")}</span>
        </div>
      ) : null}

      <WizardFooter onBack={onBack} disabled={busy}>
        {scanning ? (
          <Button
            type="button"
            variant="ghost"
            onClick={scan.abort}
            disabled={busy}
          >
            {__("Skip scan")}
          </Button>
        ) : null}
        <Button type="button" onClick={proceed} disabled={busy}>
          {__("Continue")}
          <ArrowRight className="fsa:h-4 fsa:w-4" aria-hidden />
        </Button>
      </WizardFooter>
    </div>
  );
}

function ScanProgress({ scanned, total }: { scanned: number; total: number }) {
  const pct = total > 0 ? Math.round((scanned / total) * 100) : 0;

  return (
    <div className="fsa:rounded-xl fsa:border fsa:border-slate-200 fsa:bg-white fsa:p-4 fsa:shadow-sm">
      <div className="fsa:mb-2 fsa:flex fsa:items-center fsa:justify-between fsa:text-xs fsa:text-slate-500">
        <span>{__("Scanning your content…")}</span>
        <span>
          {sprintf(
            /* translators: 1: scanned count, 2: total to scan. */
            __("%1$d / %2$d"),
            scanned,
            total,
          )}
        </span>
      </div>
      <div className="fsa:h-1.5 fsa:w-full fsa:overflow-hidden fsa:rounded-full fsa:bg-slate-100">
        <div
          className="fsa:h-full fsa:rounded-full fsa:bg-brand-600 fsa:transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const BUCKET_META: Record<
  ScanBucket,
  { label: string; dot: string; chip: string }
> = {
  good: {
    label: __("good"),
    dot: "fsa:bg-emerald-500",
    chip: "fsa:bg-emerald-50 fsa:text-emerald-700",
  },
  needs: {
    label: __("needs improvement"),
    dot: "fsa:bg-amber-500",
    chip: "fsa:bg-amber-50 fsa:text-amber-700",
  },
  poor: {
    label: __("poor"),
    dot: "fsa:bg-red-500",
    chip: "fsa:bg-red-50 fsa:text-red-700",
  },
};

function BucketChip({ bucket, count }: { bucket: ScanBucket; count: number }) {
  const meta = BUCKET_META[bucket];

  return (
    <span className="fsa:inline-flex fsa:items-center fsa:gap-1.5 fsa:rounded-full fsa:bg-slate-50 fsa:px-2.5 fsa:py-1 fsa:text-xs fsa:font-medium fsa:text-slate-600">
      <span
        className={`fsa:h-2 fsa:w-2 fsa:rounded-full ${meta.dot}`}
        aria-hidden
      />
      {sprintf(
        /* translators: 1: count, 2: bucket label e.g. "good". */
        __("%1$d %2$s"),
        count,
        meta.label,
      )}
    </span>
  );
}

function ScoreChip({ score, bucket }: { score: number; bucket: ScanBucket }) {
  return (
    <span
      className={`fsa:inline-flex fsa:h-7 fsa:w-9 fsa:shrink-0 fsa:items-center fsa:justify-center fsa:rounded-md fsa:text-xs fsa:font-semibold ${BUCKET_META[bucket].chip}`}
    >
      {score}
    </span>
  );
}

function countBuckets(items: ScanItem[]): Record<ScanBucket, number> {
  return items.reduce(
    (acc, item) => {
      acc[bucketOf(item.grade)] += 1;
      return acc;
    },
    { good: 0, needs: 0, poor: 0 } as Record<ScanBucket, number>,
  );
}
