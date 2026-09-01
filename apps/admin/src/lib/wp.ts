/**
 * Bridge to the `flexaSeoAeo` global published by Enqueue.php via
 * wp_localize_script.
 */

export type AppTheme = "light" | "dark";

export interface PluginGlobal {
    restUrl: string;
    restNonce: string;
    version: string;
    pluginUrl: string;
    /** Site home URL with trailing slash — for links to /sitemap.xml, /llms.txt. */
    homeUrl: string;
    /** Admin-facing brand label; follows the white-label setting. */
    brandName: string;
    locale: string;
    theme: AppTheme;
    /** Whether WooCommerce is active — gates the commerce AEO toggle. */
    hasWoo: boolean;
    /**
     * Whether the current user can change global settings (manage_options) —
     * gates the one-click "Enable site-wide" fix on the dashboard.
     */
    canManageSettings: boolean;
    /** Public post types as `slug => label`, for the sitemap multi-select. */
    postTypes: Record<string, string>;
    /** Public taxonomies as `slug => label`, for the sitemap multi-select. */
    taxonomies: Record<string, string>;
}

declare global {
    interface Window {
        flexaSeoAeo?: PluginGlobal;
    }
}

export function getPluginGlobal(): PluginGlobal {
    if (!window.flexaSeoAeo) {
        throw new Error(
            "flexaSeoAeo global missing - make sure Enqueue::enqueue_admin ran before this script.",
        );
    }
    return window.flexaSeoAeo;
}
