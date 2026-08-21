import {
    Bot,
    Building2,
    Network,
    Palette,
    Rss,
    Share2,
    ShieldAlert,
    Type,
    Wrench,
    type LucideIcon,
} from "lucide-react";
import { __ } from "@/lib/i18n";

export type SectionId =
    | "general"
    | "social"
    | "organization"
    | "sitemaps"
    | "indexing"
    | "aeo"
    | "branding"
    | "tools"
    | "danger";

export interface SectionMeta {
    id: SectionId;
    title: string;
    subtitle: string;
    icon: LucideIcon;
    paneTitle: string;
    paneSubtitle: string;
}

export const SECTIONS: SectionMeta[] = [
    {
        id: "general",
        title: __("Titles & Meta"),
        subtitle: __("Document titles and descriptions"),
        icon: Type,
        paneTitle: __("Titles & Meta"),
        paneSubtitle: __("Control the <title>, meta description, and homepage defaults."),
    },
    {
        id: "social",
        title: __("Social"),
        subtitle: __("Open Graph & X cards"),
        icon: Share2,
        paneTitle: __("Social Sharing"),
        paneSubtitle: __("How pages look when shared to social and chat apps."),
    },
    {
        id: "organization",
        title: __("Organization"),
        subtitle: __("Knowledge graph identity"),
        icon: Building2,
        paneTitle: __("Organization"),
        paneSubtitle: __("Who publishes this site, for the schema knowledge graph."),
    },
    {
        id: "sitemaps",
        title: __("Sitemaps"),
        subtitle: __("XML & HTML sitemaps"),
        icon: Network,
        paneTitle: __("Sitemaps"),
        paneSubtitle: __("Tell search engines and answer engines what to crawl."),
    },
    {
        id: "indexing",
        title: __("Indexing"),
        subtitle: __("IndexNow & robots.txt"),
        icon: Rss,
        paneTitle: __("Indexing"),
        paneSubtitle: __("Push instant index signals and tune the virtual robots.txt."),
    },
    {
        id: "aeo",
        title: __("AEO Core"),
        subtitle: __("Answer-engine optimization"),
        icon: Bot,
        paneTitle: __("AEO Core"),
        paneSubtitle: __("Make your content first-class for AI answer engines."),
    },
    {
        id: "branding",
        title: __("Branding"),
        subtitle: __("White-label the plugin"),
        icon: Palette,
        paneTitle: __("Branding"),
        paneSubtitle: __("Rename the plugin in wp-admin for a white-label setup."),
    },
    {
        id: "tools",
        title: __("Tools"),
        subtitle: __("Import & export settings"),
        icon: Wrench,
        paneTitle: __("Import & Export"),
        paneSubtitle: __("Back up your configuration or move it between sites."),
    },
    {
        id: "danger",
        title: __("Danger Zone"),
        subtitle: __("Destructive actions"),
        icon: ShieldAlert,
        paneTitle: __("Danger Zone"),
        paneSubtitle: __("Reset everything back to a clean slate."),
    },
];
