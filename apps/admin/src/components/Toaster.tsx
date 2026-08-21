import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { useUiStore } from "@/lib/store";

const AUTO_DISMISS_MS = 2500;

let activeClaim: symbol | null = null;

/**
 * The admin app can mount more than one React root in a page. A module-level
 * claim ensures only the first-mounted Toaster renders, so we don't get
 * duplicate portal'd toasts stacked on top of one another.
 */
export function Toaster() {
    const toast = useUiStore((s) => s.toast);
    const dismiss = useUiStore((s) => s.dismissToast);
    const [owns, setOwns] = useState(false);

    useEffect(() => {
        if (activeClaim !== null) {
            return;
        }
        const claim = Symbol("toaster");
        activeClaim = claim;
        setOwns(true);
        return () => {
            if (activeClaim === claim) {
                activeClaim = null;
            }
            setOwns(false);
        };
    }, []);

    useEffect(() => {
        if (!owns || !toast) {
            return;
        }
        const timer = window.setTimeout(dismiss, AUTO_DISMISS_MS);
        return () => window.clearTimeout(timer);
    }, [owns, toast, dismiss]);

    if (!owns || !toast) {
        return null;
    }

    return createPortal(
        <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className="fsa:pointer-events-none fsa:fixed fsa:left-1/2 fsa:top-6 fsa:z-[160003] fsa:-translate-x-1/2"
        >
            <div
                className={cn(
                    "fsa:pointer-events-auto fsa:flex fsa:items-center fsa:gap-2 fsa:rounded-full fsa:px-4 fsa:py-2 fsa:text-sm fsa:shadow-lg fsa:ring-1",
                    toast.tone === "error"
                        ? "fsa:bg-red-50 fsa:text-red-700 fsa:ring-red-200"
                        : "fsa:bg-emerald-50 fsa:text-emerald-800 fsa:ring-emerald-200",
                )}
            >
                {toast.tone === "error" ? (
                    <X aria-hidden className="fsa:h-4 fsa:w-4" />
                ) : (
                    <Check aria-hidden className="fsa:h-4 fsa:w-4" />
                )}
                <span>{toast.message}</span>
            </div>
        </div>,
        document.body,
    );
}
