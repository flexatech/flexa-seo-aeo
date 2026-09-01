import { LayoutDashboard, Settings as SettingsIcon, Sparkles } from "lucide-react";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
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
                            const selected = view === tab.id;
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

            {view === "dashboard" ? <DashboardPage /> : <SettingsPage />}
        </div>
    );
}
