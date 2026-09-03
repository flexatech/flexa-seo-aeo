import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Globe,
  Languages,
  Search,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { __, sprintf } from "@/lib/i18n";
import type { StepProps } from "./useOnboarding";
import { WizardFooter } from "./WizardFooter";

/**
 * Screen 1: Welcome & Site Detection. Everything here is read from the detection
 * payload, nothing is typed. The editable knowledge name lives on the SEO step
 * where its recommendation is. Mirrors docs/onboarding-design.md §5.1.
 */
export function WelcomeStep({ detect, onContinue, busy }: StepProps) {
  const siteName = detect.site_name || detect.site_url;
  const activePlugins = detect.seo_plugins.filter((plugin) => plugin.active);
  const dataPlugins = detect.seo_plugins.filter((plugin) => plugin.count > 0);

  const typeLabel = detect.has_woocommerce
    ? __("WooCommerce store")
    : detect.site_type === "blog"
      ? __("Blog")
      : __("Website");

  return (
    <div className="fsa:space-y-6">
      <div className="fsa:space-y-2">
        <h1 className="fsa:text-2xl fsa:font-bold fsa:text-slate-900">
          {sprintf(
            /* translators: %s: site name. */
            __("Let's make %s answer-engine ready"),
            siteName,
          )}
        </h1>
        <p className="fsa:text-sm fsa:text-slate-600">
          {detect.settings_configured
            ? __(
                "Flexa SEO is already partly configured. We'll only suggest what's missing.",
              )
            : __("We detected your setup. Nothing to fill in.")}
        </p>
      </div>

      <div className="fsa:rounded-xl fsa:border fsa:border-slate-200 fsa:bg-white fsa:p-5 fsa:shadow-sm">
        <div className="fsa:grid fsa:gap-3 fsa:sm:grid-cols-2">
          <DetectRow icon={<Globe className="fsa:h-4 fsa:w-4" aria-hidden />}>
            {detect.site_url}
          </DetectRow>
          <DetectRow
            icon={<Languages className="fsa:h-4 fsa:w-4" aria-hidden />}
          >
            {sprintf(
              /* translators: %s: site language, e.g. en_US. */
              __("Language: %s"),
              detect.language,
            )}
          </DetectRow>
          <DetectRow
            icon={<Building2 className="fsa:h-4 fsa:w-4" aria-hidden />}
          >
            {typeLabel}
          </DetectRow>
          {dataPlugins.length > 0 ? (
            <DetectRow
              icon={<Search className="fsa:h-4 fsa:w-4" aria-hidden />}
            >
              {sprintf(
                /* translators: 1: SEO plugin name, 2: number of posts with data. */
                __("Existing data: %1$s (%2$d posts)"),
                dataPlugins.map((plugin) => plugin.label).join(", "),
                dataPlugins.reduce((sum, plugin) => sum + plugin.count, 0),
              )}
            </DetectRow>
          ) : null}
        </div>

        {(activePlugins.length > 0 || !detect.pretty_permalinks) && (
          <div className="fsa:mt-4 fsa:space-y-2">
            {activePlugins.map((plugin) => (
              <WarningRow key={plugin.id}>
                {sprintf(
                  /* translators: %s: SEO plugin name. */
                  __(
                    "%s is still active. Deactivate it after setup to avoid duplicate meta tags.",
                  ),
                  plugin.label,
                )}
              </WarningRow>
            ))}
            {!detect.pretty_permalinks && (
              <WarningRow>
                {__(
                  "Pretty permalinks are off. The sitemap and /llms.txt need them.",
                )}{" "}
                <a
                  href="options-permalink.php"
                  className="fsa:font-medium fsa:text-amber-800 fsa:underline"
                >
                  {__("Open Permalink Settings")}
                </a>
              </WarningRow>
            )}
          </div>
        )}
      </div>

      <WizardFooter disabled={busy}>
        <span className="fsa:mr-2 fsa:hidden fsa:text-xs fsa:text-slate-500 fsa:sm:inline">
          {__("≈ 3 minutes · you can exit anytime")}
        </span>
        <Button type="button" onClick={onContinue} disabled={busy}>
          {__("Start setup")}
          <ArrowRight className="fsa:h-4 fsa:w-4" aria-hidden />
        </Button>
      </WizardFooter>
    </div>
  );
}

function DetectRow({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="fsa:flex fsa:items-center fsa:gap-2 fsa:text-sm fsa:text-slate-700">
      <span className="fsa:shrink-0 fsa:text-slate-400">{icon}</span>
      <span className="fsa:truncate">{children}</span>
    </div>
  );
}

function WarningRow({ children }: { children: ReactNode }) {
  return (
    <div className="fsa:flex fsa:items-start fsa:gap-2 fsa:rounded-md fsa:border fsa:border-amber-200 fsa:bg-amber-50 fsa:p-3 fsa:text-xs fsa:text-amber-800">
      <AlertTriangle
        className="fsa:mt-0.5 fsa:h-4 fsa:w-4 fsa:shrink-0"
        aria-hidden
      />
      <span>{children}</span>
    </div>
  );
}
