=== Flexa SEO - AEO ===
Contributors: flexatech
Tags: seo, schema, sitemap, aeo, woocommerce
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 8.2
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
WC requires at least: 8.0
WC tested up to: 11.0

Complete WordPress SEO — schema, sitemaps, meta, Open Graph — plus an Answer-Engine Readiness score that grades every post for AI search.

== Description ==

Flexa SEO is a complete, privacy-first SEO plugin: title & meta templating, JSON-LD schema, XML sitemaps, Open Graph, `robots.txt`, IndexNow, and one-click migration from Yoast, Rank Math and SEOPress. It covers the SEO baseline you expect — and then goes one step further than any of them.

**What makes it different: the Answer-Engine Readiness Score**

AI answer engines (ChatGPT, Perplexity, Claude, Google AI Overviews) now decide whether your content gets *quoted* — not just ranked. Dozens of plugins will generate an `llms.txt` file and stop there. Flexa SEO is the only one that **measures and scores how quotable each post actually is**, right in the block editor:

* A live **0–100 readiness score** with a letter grade for the post you're editing, refreshed on every save.
* An **actionable checklist** across eight signals answer engines rely on: structured data, a concise meta description, an answer-first opening paragraph, question-style headings, FAQ/Q&A blocks, `llms.txt` inclusion, a Markdown alternate for crawlers, and content depth.
* Each item comes with a plain-English fix — so writers know *exactly* what to change to become citable, no guesswork and no external tool.
* Extensible via the `flexa_seo_aeo/aeo/readiness_checks` filter for themes and add-ons.

This turns "AEO" from a file you generate once into a workflow your team improves post by post — the gap the crowded llms.txt category leaves wide open.

**Core SEO**

* Title & meta description templating with a token engine (site, post, term, author, date, pagination variables).
* JSON-LD structured data (`@graph`): Article / BlogPosting / WebPage, WebSite + SearchAction, Organization / Person publisher, and automatic FAQPage from core FAQ blocks.
* Open Graph and Twitter Card tags, canonical URLs, and configurable robots directives (AEO-friendly defaults: `max-snippet:-1`, `max-image-preview:large`).
* XML sitemaps (index + per-type sub-sitemaps, image entries) with a branded XSL stylesheet, plus an HTML sitemap shortcode `[flexa_sitemap]` and a sitemap block.
* Per-post editing in a classic metabox **and** a Gutenberg editor sidebar, with one-click **migration from Yoast / Rank Math / SEOPress** (and read-fallback so nothing breaks mid-move).
* `robots.txt` management and optional **IndexNow** ping on publish/update (see *External services* below).

**AI answer-engine tooling**

* Native **`/llms.txt`** endpoint describing your site for large language models.
* **Agent Readiness** — advertises a Markdown alternate of each post (`?flexa-aeo=md`) via a `Link` header and `<link rel="alternate">`, and serves a clean, token-cheap Markdown rendering for AI crawlers and coding agents.
* No cloud account and no per-request AI fees: the readiness score and every AEO feature run entirely on your own server.

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
3. Open **Flexa SEO** in the admin menu to configure titles, social, sitemaps, indexing, and the AEO Core options.

== Frequently Asked Questions ==

= What is the Answer-Engine Readiness Score? =

It is a per-post grade (0–100) shown in the block-editor sidebar that measures how ready the post is to be quoted by AI answer engines. It checks eight signals — structured data, meta description, an answer-first opening, question-style headings, FAQ blocks, llms.txt inclusion, a Markdown alternate, and content depth — and gives a plain-English fix for each. It runs entirely on your server, with no AI account or API key.

= How is this different from the many llms.txt plugins? =

Most of those generate a single `llms.txt` file and stop. Flexa SEO does that too, but its focus is *measuring and improving* how quotable each page is, post by post, plus a full SEO baseline (schema, sitemaps, meta, migration). The readiness score is the workflow those file-only tools don't offer.

= Does this plugin require an account or send my data anywhere? =

No. There is no account and no telemetry. The only outbound request is the optional IndexNow ping, which you enable yourself and which sends only changed public URLs (see *External services*).

= Will it conflict with Yoast, Rank Math, or SEOPress? =

Run one SEO plugin at a time. Flexa SEO can read existing per-post meta from those plugins as a fallback, easing migration.

= Does it work without WooCommerce? =

Yes. WooCommerce product schema is an optional layer that activates only when WooCommerce is installed.

== Changelog ==

= 0.1.0 =
* Initial release: **Answer-Engine Readiness Score** (per-post 0–100 grade + actionable checklist in the block editor), title/meta templating, Open Graph & Twitter, canonical & robots, XML/HTML sitemaps, robots.txt, IndexNow, llms.txt, Agent Readiness Markdown export, JSON-LD schema (Article/WebPage/WebSite/Organization/FAQ), one-click migration from Yoast/Rank Math/SEOPress, optional WooCommerce Product schema, and a React admin app.
