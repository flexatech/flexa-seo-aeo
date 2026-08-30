=== Flexa SEO - AEO ===
Contributors: flexatech
Tags: seo, aeo, sitemap, open graph, llms.txt
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 8.2
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
WC requires at least: 8.0
WC tested up to: 11.0

Privacy-first WordPress SEO built AEO/GEO-first: titles & metas, Open Graph, sitemaps, and native llms.txt / Agent Readiness for AI answer engines.

== Description ==

Flexa AEO is a lightweight, privacy-first SEO plugin built **AEO/GEO-first** — it treats Answer Engine Optimization (how AI assistants and answer engines read your site) as a core feature, not a bolt-on. It ships the SEO baseline you expect, plus first-class tooling for AI crawlers, and it never requires a cloud account: your data stays on your site.

**Core SEO**

* Title & meta description templating with a token engine (site, post, term, author, date, pagination variables).
* Open Graph and Twitter Card tags, canonical URLs, and configurable robots directives (AEO-friendly defaults: `max-snippet:-1`, `max-image-preview:large`).
* Per-post editing in a classic metabox **and** a Gutenberg editor sidebar, with migration-read fallback for existing Yoast / Rank Math / SEOPress meta.
* XML sitemaps (index + per-type sub-sitemaps, image entries) with a branded XSL stylesheet, plus an HTML sitemap shortcode `[flexa_sitemap]` and a sitemap block.
* `robots.txt` management and optional **IndexNow** ping on publish/update (see *External services* below).

**AEO / GEO core (the differentiator)**

* Native **`/llms.txt`** endpoint describing your site for large language models.
* **Agent Readiness** — advertises a Markdown alternate of each post (`?flexa-aeo=md`) via a `Link` header and `<link rel="alternate">`, and serves a clean, token-cheap Markdown rendering for AI crawlers and coding agents.
* Structured data (JSON-LD `@graph`): Article / BlogPosting / WebPage, WebSite + SearchAction, Organization / Person publisher, and automatic FAQPage from core FAQ blocks.

**WooCommerce (optional)**

* When WooCommerce is active, emits Product / Offer / AggregateOffer JSON-LD (price, availability, rating) and Open Graph product tags for AI shopping surfaces.

**Privacy**

* No account, no telemetry, no phone-home. The only outbound request is the optional IndexNow ping you enable yourself (disclosed below).

== External services ==

This plugin connects to one third-party service, and only when you explicitly enable it.

**IndexNow (optional — "IndexNow ping" setting)**

When the IndexNow feature is turned on, the plugin notifies the IndexNow API each time you publish or update a post so participating search engines (e.g. Microsoft Bing, Yandex) can recrawl the changed URL quickly.

* **What is sent:** your site host, the changed URL(s), and an IndexNow verification key (a random key the plugin generates and serves at `/{key}.txt` on your own site). No personal data and no post content are transmitted — only the public URL that changed.
* **When:** on the `publish`/update transition of a post, as a non-blocking background request. Nothing is sent while the feature is disabled (it is off by default).
* **Endpoint:** `https://api.indexnow.org/indexnow` (operated by Microsoft).

IndexNow is an open protocol. Documentation and terms: https://www.indexnow.org/documentation — Privacy statement (Microsoft, operator of the endpoint): https://privacy.microsoft.com/privacystatement

== Source code ==

The plugin ships compiled JavaScript/CSS for its admin app in `assets/dist/`. The human-readable source (`apps/admin/src/`) and its build configuration are **included in the plugin package**, so no external download is required.

The admin app is built with pnpm, Vite, React and TypeScript:

1. `pnpm install`
2. `pnpm build`   (or `pnpm dev` for a watched build)

The `.pot` translation template is regenerated with `pnpm i18n:pot` (PHP + vanilla JS via WP-CLI, React strings via a TypeScript-AST extractor in `tools/i18n/`).

== Installation ==

1. Upload the `flexa-seo-aeo` folder to `/wp-content/plugins/`, or install it through the Plugins screen.
2. Activate the plugin through the *Plugins* screen in WordPress.
3. Open **Flexa AEO** in the admin menu to configure titles, social, sitemaps, indexing, and the AEO Core options.

== Frequently Asked Questions ==

= Does this plugin require an account or send my data anywhere? =

No. There is no account and no telemetry. The only outbound request is the optional IndexNow ping, which you enable yourself and which sends only changed public URLs (see *External services*).

= Will it conflict with Yoast, Rank Math, or SEOPress? =

Run one SEO plugin at a time. Flexa AEO can read existing per-post meta from those plugins as a fallback, easing migration.

= Does it work without WooCommerce? =

Yes. WooCommerce product schema is an optional layer that activates only when WooCommerce is installed.

== Changelog ==

= 0.1.0 =
* Initial release: title/meta templating, Open Graph & Twitter, canonical & robots, XML/HTML sitemaps, robots.txt, IndexNow, llms.txt, Agent Readiness Markdown export, JSON-LD schema (Article/WebPage/WebSite/Organization/FAQ), optional WooCommerce Product schema, and a React admin app.
