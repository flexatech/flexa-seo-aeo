import { create } from "zustand";
import { persist, type PersistOptions } from "zustand/middleware";

export interface ToastState {
  id: number;
  message: string;
  tone: "success" | "error";
}

/** Top-level screen: the health dashboard, the settings editor, or the
 *  full-screen Setup Assistant takeover. */
export type AppView = "dashboard" | "settings" | "setup";

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
  /** Transient: true when the wizard was opened on purpose (deep link or a
   *  re-entry button), so the finished-setup fall-through is bypassed.
   *  Never persisted, so a plain reload clears it and stale views fall back. */
  setupIntent: boolean;
  setView: (view: AppView) => void;
  /** Open the Setup Assistant takeover intentionally. */
  openSetup: () => void;
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
      setupIntent: false,
      setView: (view) => set({ view }),
      openSetup: () => set({ view: "setup", setupIntent: true }),
      openSection: (activeSection) => set({ activeSection, view: "settings" }),
      setActiveSection: (activeSection) => set({ activeSection }),
      showToast: (message, tone = "success") =>
        set({ toast: { id: Date.now(), message, tone } }),
      dismissToast: () => set({ toast: null }),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
    }),
    persistOptions,
  ),
);
