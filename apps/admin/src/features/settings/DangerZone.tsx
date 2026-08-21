import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUiStore } from "@/lib/store";
import { __ } from "@/lib/i18n";
import { useResetAllData } from "./useSettings";

const CONFIRM_PHRASE = "reset flexa aeo";

export function DangerZone() {
    const [open, setOpen] = useState(false);
    const [confirm, setConfirm] = useState("");
    const reset = useResetAllData();
    const showToast = useUiStore((s) => s.showToast);

    const close = () => {
        if (reset.isPending) {
            return;
        }
        setOpen(false);
        setConfirm("");
        reset.reset();
    };

    const submit = () => {
        if (confirm.trim().toLowerCase() !== CONFIRM_PHRASE) {
            return;
        }
        reset.mutate(CONFIRM_PHRASE, {
            onSuccess: () => {
                setOpen(false);
                setConfirm("");
                showToast(__("All settings were reset to defaults."));
            },
            onError: () => {
                showToast(__("Reset failed."), "error");
            },
        });
    };

    return (
        <section className="fsa:space-y-4 fsa:rounded-lg fsa:border fsa:border-red-200 fsa:bg-red-50/50 fsa:p-5">
            <header className="fsa:flex fsa:items-start fsa:gap-3">
                <AlertTriangle
                    className="fsa:mt-0.5 fsa:h-5 fsa:w-5 fsa:text-red-600"
                    aria-hidden
                />
                <div>
                    <h2 className="fsa:text-base fsa:font-semibold fsa:text-red-900">
                        {__("Danger zone")}
                    </h2>
                    <p className="fsa:text-sm fsa:text-red-800">
                        {__(
                            "Restore every Flexa AEO setting to its default and remove per-post SEO overrides. This cannot be undone.",
                        )}
                    </p>
                </div>
            </header>

            <Button variant="destructive" onClick={() => setOpen(true)}>
                {__("Reset everything…")}
            </Button>

            <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{__("Reset Flexa AEO?")}</DialogTitle>
                        <DialogDescription>
                            {__(
                                "This wipes all settings back to defaults and clears stored plugin data. This cannot be undone.",
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="fsa:space-y-1.5">
                        <Label htmlFor="flexa-seo-aeo-reset-confirm">
                            {__("Type")}{" "}
                            <code className="fsa:font-mono fsa:text-red-700">
                                {CONFIRM_PHRASE}
                            </code>{" "}
                            {__("to confirm")}
                        </Label>
                        <Input
                            id="flexa-seo-aeo-reset-confirm"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            autoComplete="off"
                            autoFocus
                        />
                        {reset.isError && (
                            <p className="fsa:text-sm fsa:text-red-700">
                                {(reset.error as Error).message}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={close}
                            disabled={reset.isPending}
                        >
                            {__("Cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={submit}
                            disabled={
                                reset.isPending ||
                                confirm.trim().toLowerCase() !== CONFIRM_PHRASE
                            }
                        >
                            {reset.isPending
                                ? __("Resetting…")
                                : __("Reset everything")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}
