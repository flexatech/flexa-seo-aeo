import { create } from "zustand";
import { persist, type PersistOptions } from "zustand/middleware";

export interface ToastState {
    id: number;
    message: string;
    tone: "success" | "error";
}

/** Top-level screen: the health dashboard or the settings editor. */
export type AppView = "dashboard" | "settings";

interface UiState {
    /** Which top-level screen is showing. Persisted so a reload lands back on it. */
    view: AppView;
    /** Which settings pane is open. Persisted so a reload lands on the same
     *  tab; everything else here is transient. */
    activeSection: string;
    /** Transient (never persisted): the active toast, or null. */
    toast: ToastState | null;
    /** Transient: whether the ⌘K command palette is open. */
    paletteOpen: boolean;
    setView: (view: AppView) => void;
    /** Jump straight to a settings section (from a dashboard recommendation). */
    openSection: (id: string) => void;
    setActiveSection: (id: string) => void;
    showToast: (message: string, tone?: ToastState["tone"]) => void;
    dismissToast: () => void;
    setPaletteOpen: (open: boolean) => void;
}

const persistOptions: PersistOptions<
    UiState,
    Pick<UiState, "view" | "activeSection">
> = {
    name: "flexa-seo-aeo:ui",
    // Persist only the nav state - never the toast queue or any server data.
    partialize: (state) => ({
        view: state.view,
        activeSection: state.activeSection,
    }),
};

export const useUiStore = create<UiState>()(
    persist(
        (set) => ({
            view: "dashboard",
            activeSection: "general",
            toast: null,
            paletteOpen: false,
            setView: (view) => set({ view }),
            openSection: (activeSection) =>
                set({ activeSection, view: "settings" }),
            setActiveSection: (activeSection) => set({ activeSection }),
            showToast: (message, tone = "success") =>
                set({ toast: { id: Date.now(), message, tone } }),
            dismissToast: () => set({ toast: null }),
            setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
        }),
        persistOptions,
    ),
);
