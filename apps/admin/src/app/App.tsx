import {
  LayoutDashboard,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";
import { useEffect } from "react";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { OnboardingPage } from "@/features/onboarding/OnboardingPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { cn } from "@/lib/cn";
import { __ } from "@/lib/i18n";
import { type AppView, useUiStore } from "@/lib/store";

const TABS: { id: AppView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: __("Dashboard"), icon: LayoutDashboard },
  { id: "settings", label: __("Settings"), icon: SettingsIcon },
];

/**
 * Top-level shell: a shared brand strip with a Dashboard / Settings switch,
 * then the active screen. Both screens read/write the same TanStack Query cache,
 * so a "Scan now" on the dashboard and a save on settings stay in sync.
 */
export function App() {
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);
  const openSetup = useUiStore((s) => s.openSetup);
  const canManageSettings = window.flexaSeoAeo?.canManageSettings ?? false;

  // Deep link: `?fsa-view=setup` (activation redirect, plugins-screen notice,
  // and later the re-entry points) opens the wizard once, then the param is
  // stripped so a subsequent reload is governed by persisted state plus the
  // finished-setup fall-through inside OnboardingPage.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("fsa-view") !== "setup") {
      return;
    }
    params.delete("fsa-view");
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
    );
    if (canManageSettings) {
      openSetup();
    }
  }, [canManageSettings, openSetup]);

  // The wizard is a full-screen takeover with its own chrome, gated on the
  // settings capability (editors never fetch /onboarding).
  if (view === "setup" && canManageSettings) {
    return <OnboardingPage />;
  }

  // A persisted "setup" view for a user who can't manage settings falls back
  // to the dashboard rather than showing an empty takeover.
  const effectiveView: AppView = view === "setup" ? "dashboard" : view;

  return (
    <div className="fsa:min-h-full fsa:bg-slate-50">
      <div className="fsa:border-b fsa:border-slate-200 fsa:bg-white">
        <div className="fsa:mx-auto fsa:flex fsa:max-w-6xl fsa:flex-wrap fsa:items-center fsa:gap-x-6 fsa:gap-y-2 fsa:px-6 fsa:py-3">
          <div className="fsa:flex fsa:items-center fsa:gap-4">
            <span className="fsa:flex fsa:h-10 fsa:w-10 fsa:shrink-0 fsa:items-center fsa:justify-center fsa:rounded-lg fsa:bg-brand-500 fsa:text-white fsa:shadow-sm">
              <Sparkles className="fsa:h-5 fsa:w-5" aria-hidden />
            </span>
            <div className="fsa:leading-tight">
              <div className="fsa:text-sm fsa:font-semibold fsa:text-slate-900">
                {window.flexaSeoAeo?.brandName || __("Flexa SEO")}
              </div>
              <div className="fsa:text-xs fsa:text-slate-500">
                {__("AEO-first SEO for WordPress")}
              </div>
            </div>
          </div>

          <nav className="fsa:flex fsa:items-center fsa:gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const selected = effectiveView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setView(tab.id)}
                  aria-pressed={selected}
                  className={cn(
                    "fsa:flex fsa:items-center fsa:gap-2 fsa:rounded-lg fsa:px-3 fsa:py-2 fsa:text-sm fsa:font-semibold fsa:transition-colors fsa:cursor-pointer",
                    "fsa:focus-visible:outline-none fsa:focus-visible:ring-2 fsa:focus-visible:ring-brand-500",
                    selected
                      ? "fsa:bg-brand-50 fsa:text-brand-700"
                      : "fsa:text-slate-600 fsa:hover:bg-slate-100",
                  )}
                >
                  <Icon className="fsa:h-4 fsa:w-4" aria-hidden />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {effectiveView === "dashboard" ? <DashboardPage /> : <SettingsPage />}
    </div>
  );
}
