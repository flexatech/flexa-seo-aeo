import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

/** One scored post from GET /onboarding/scan. */
export interface ScanItem {
  id: number;
  title: string;
  url: string;
  score: number;
  grade: "excellent" | "good" | "fair" | "poor";
  worst_check: string;
}

/** One batch envelope from GET /onboarding/scan. */
interface ScanBatch {
  total: number;
  offset: number;
  batch: number;
  done: boolean;
  items: ScanItem[];
}

export type ScanStatus = "scanning" | "done" | "error";

export interface ContentScan {
  status: ScanStatus;
  /** The capped scan window size the server reported. */
  total: number;
  /** How many posts have been scored so far. */
  scanned: number;
  items: ScanItem[];
  error: string | null;
  /** Stop the loop and keep whatever was already scanned (the Skip action). */
  abort: () => void;
}

/** Posts scored per request. Small so each batch stays fast on shared hosts. */
const BATCH_SIZE = 4;

/**
 * Drive the read-only onboarding content scan. The screen renders first, then
 * this fires sequential `/onboarding/scan` batches until the server reports
 * `done`, accumulating scored posts as it goes. Nothing is ever written, so
 * aborting just stops the loop with no cleanup, and a mid-scan error keeps the
 * partial results. Mirrors docs/onboarding-design.md §6.
 */
export function useContentScan(): ContentScan {
  const [status, setStatus] = useState<ScanStatus>("scanning");
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<ScanItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortedRef = useRef(false);

  useEffect(() => {
    abortedRef.current = false;
    let cancelled = false;

    void (async () => {
      let offset = 0;

      // Guard against a server that never flips `done` (empty result set).
      for (let guard = 0; guard < 1000; guard++) {
        if (cancelled || abortedRef.current) {
          return;
        }

        let batch: ScanBatch;
        try {
          batch = await api.get<ScanBatch>(
            `onboarding/scan?offset=${offset}&batch=${BATCH_SIZE}`,
          );
        } catch (err) {
          if (!cancelled && !abortedRef.current) {
            setError((err as Error).message);
            setStatus("error");
          }
          return;
        }

        if (cancelled || abortedRef.current) {
          return;
        }

        setTotal(batch.total);
        setItems((prev) => [...prev, ...batch.items]);
        offset += batch.items.length;

        if (batch.done) {
          setStatus("done");
          return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const abort = useCallback(() => {
    abortedRef.current = true;
    setStatus((prev) => (prev === "scanning" ? "done" : prev));
  }, []);

  return {
    status,
    total,
    scanned: items.length,
    items,
    error,
    abort,
  };
}

/** Three display buckets the grades collapse into. */
export type ScanBucket = "good" | "needs" | "poor";

export function bucketOf(grade: ScanItem["grade"]): ScanBucket {
  if (grade === "excellent" || grade === "good") {
    return "good";
  }
  if (grade === "fair") {
    return "needs";
  }
  return "poor";
}
