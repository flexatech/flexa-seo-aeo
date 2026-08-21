import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface MigrationSource {
    id: string;
    label: string;
    count: number;
    available: boolean;
}

/** One batch result from POST /migrate. */
export interface MigrationBatch {
    source: string;
    total: number;
    processed: number;
    migrated: number;
    skipped: number;
    next_offset: number;
    done: boolean;
}

/** Cumulative progress reported to the UI across batches. */
export interface MigrationProgress {
    total: number;
    processed: number;
    migrated: number;
    skipped: number;
    done: boolean;
}

const SOURCES_KEY = ["migration", "sources"] as const;

export function useMigrationSources() {
    return useQuery<MigrationSource[]>({
        queryKey: SOURCES_KEY,
        queryFn: async () => {
            const res = await api.get<{ sources: MigrationSource[] }>(
                "migrate/sources",
            );
            return res.sources;
        },
    });
}

/**
 * Drive a full migration by calling POST /migrate one batch at a time until
 * the server reports `done`, folding each batch into a cumulative progress
 * object handed to `onProgress`. The server caps the batch size, so a large
 * site is walked in bounded requests that never time out.
 */
export async function runMigration(
    source: string,
    overwrite: boolean,
    onProgress: (p: MigrationProgress) => void,
): Promise<MigrationProgress> {
    let offset = 0;
    let migrated = 0;
    let skipped = 0;
    let progress: MigrationProgress = {
        total: 0,
        processed: 0,
        migrated: 0,
        skipped: 0,
        done: false,
    };

    // Guard against a server that never flips `done` (empty result set).
    for (let guard = 0; guard < 100000; guard++) {
        const batch = await api.post<MigrationBatch>("migrate", {
            source,
            overwrite,
            offset,
            batch: 100,
        });

        migrated += batch.migrated;
        skipped += batch.skipped;
        offset = batch.next_offset;
        progress = {
            total: batch.total,
            processed: Math.min(offset, batch.total),
            migrated,
            skipped,
            done: batch.done,
        };
        onProgress(progress);

        if (batch.done) {
            break;
        }
    }

    return progress;
}
