import { create } from "zustand";
import { persist, type PersistOptions } from "zustand/middleware";

export interface ToastState {
    id: number;
    message: string;
    tone: "success" | "error";
}

interface UiState {
    /** Which settings pane is open. Persisted so a reload lands on the same
     *  tab; everything else here is transient. */
    activeSection: string;
    /** Transient (never persisted): the active toast, or null. */
    toast: ToastState | null;
    /** Transient: whether the ⌘K command palette is open. */
    paletteOpen: boolean;
    setActiveSection: (id: string) => void;
    showToast: (message: string, tone?: ToastState["tone"]) => void;
    dismissToast: () => void;
    setPaletteOpen: (open: boolean) => void;
}

const persistOptions: PersistOptions<
    UiState,
    Pick<UiState, "activeSection">
> = {
    name: "flexa-seo-aeo:ui",
    // Persist only the nav tab - never the toast queue or any server data.
    partialize: (state) => ({ activeSection: state.activeSection }),
};

export const useUiStore = create<UiState>()(
    persist(
        (set) => ({
            activeSection: "general",
            toast: null,
            paletteOpen: false,
            setActiveSection: (activeSection) => set({ activeSection }),
            showToast: (message, tone = "success") =>
                set({ toast: { id: Date.now(), message, tone } }),
            dismissToast: () => set({ toast: null }),
            setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
        }),
        persistOptions,
    ),
);
