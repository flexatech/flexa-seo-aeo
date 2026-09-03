=== Flexa SEO - AEO ===
Contributors: flexatech
Tags: seo, schema, sitemap, aeo, woocommerce
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 8.2
Stable tag: 0.3.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
WC requires at least: 8.0
WC tested up to: 11.0

Complete WordPress SEO — schema, sitemaps, meta, Open Graph — plus an Answer-Engine Readiness score that grades every post for AI search.

== Description ==

Flexa SEO is a complete, privacy-first SEO plugin: title & meta templating, JSON-LD schema, XML sitemaps, Open Graph, `robots.txt`, IndexNow, and one-click migration from Yoast, Rank Math and SEOPress. It covers the SEO baseline you expect — and then goes one step further than any of them.

A guided **Setup Assistant** takes you from activation to a configured, answer-engine-ready site in a few minutes: it detects your setup, recommends the SEO and AEO settings that fit, and applies them in one click. Every recommendation is compared against the defaults, so you see exactly which settings will change before anything is applied and any value you set yourself is kept.

**What makes it different: the Answer-Engine Readiness Score**

AI answer engines (ChatGPT, Perplexity, Claude, Google AI Overviews) now decide whether your content gets *quoted* — not just ranked. Dozens of plugins will generate an `llms.txt` file and stop there. Flexa SEO is the only one that **measures and scores how quotable each post actually is**, right in the block editor:

* A live **0–100 readiness score** with a letter grade for the post you're editing, refreshed on every save.
* An **actionable checklist** across eight signals answer engines rely on: structured data, a concise meta description, an answer-first opening paragraph, question-style headings, FAQ/Q&A blocks, `llms.txt` inclusion, a Markdown alternate for crawlers, and content depth.
* Each item comes with a plain-English fix — so writers know *exactly* what to change to become citable, no guesswork and no external tool.
* A site-wide **health Dashboard** rolls those scores up across your content: overall SEO / AEO / Technical scores, an issues overview, health breakdowns, prioritised actions, and a "Pages needing attention" list where each page reveals what to fix — with a one-click **Enable site-wide** button on the checks that are just a settings toggle away (structured data, llms.txt, Markdown alternate).
* Extensible via the `flexa_seo_aeo/aeo/readiness_checks` filter for themes and add-ons.

This turns "AEO" from a file you generate once into a workflow your team improves post by post — the gap the crowded llms.txt category leaves wide open.

**Core SEO**

* Title & meta description templating with a token engine (site, post, term, author, date, pagination variables).
* JSON-LD structured data (`@graph`): Article / BlogPosting / WebPage, WebSite + SearchAction, Organization / Person publisher, and automatic FAQPage from core FAQ blocks.
* Open Graph and Twitter Card tags, canonical URLs, and configurable robots directives (AEO-friendly defaults: `max-snippet:-1`, `max-image-preview:large`).
* XML sitemaps (index + per-type sub-sitemaps, image entries) with a branded XSL stylesheet, plus an HTML sitemap shortcode `[flexa_seo_aeo_sitemap]` and a sitemap block.
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

== Screenshots ==

1. Health Dashboard: overall SEO, AEO and Technical SEO scores, an SEO & AEO score trend, and an issues overview (critical, warnings, opportunities, passed).
2. SEO Health and AEO Health breakdowns, with prioritised recommended actions.
3. "Pages needing attention" list: per-page AEO score and issue count, expandable to show exactly what to fix, with a link straight to the editor.
4. Settings: title and meta description templating with the token engine.
5. Settings: XML and HTML sitemaps, with per-post-type and per-taxonomy inclusion.
6. Settings: AEO Core options: llms.txt, the Markdown alternate for AI crawlers, and other answer-engine controls.

== Changelog ==

= 0.3.0 =
* New: **Setup Assistant**, a guided onboarding wizard. It detects your site, recommends the SEO and AEO settings that fit, and applies them in one click. The flow covers search essentials, AI readiness, a quick content-readiness scan of your recent pages, optional migration from Yoast or Rank Math, and a final readiness report that seeds your Dashboard. Nothing is ever overwritten: recommendations are compared against the defaults, you see every setting that will change before applying, and any value you already customized is kept.
* New: re-enter the Setup Assistant any time from the Dashboard card, from Settings › Tools, or from the command palette. A re-run only proposes settings that are still at their defaults, so it is safe to run repeatedly.
* Security: running a full site scan now requires the "edit others' posts" capability (Editors and Administrators), so lower-privileged roles can no longer trigger the site-wide scan through the REST API. Viewing the cached Dashboard report is unchanged.

= 0.2.0 =
* New: **SEO/AEO health Dashboard** — overall SEO, AEO and Technical scores, an issues overview, SEO & AEO health breakdowns, prioritised recommended actions, and a "Pages needing attention" list. Each listed page expands to show exactly which readiness checks fail (with a plain-English fix), links straight to the editor, and can be re-scanned on its own after an edit — no full site scan needed.
* New: **one-click "Enable site-wide" fix** — readiness checks that fail only because a global toggle is off (structured data, llms.txt, Markdown alternate) get a Fix button on the dashboard and in the block-editor sidebar; it flips the setting and re-scores your pages. Shown only to users who can manage settings. No AI, no external calls.
* New: score trend — a lightweight history of your SEO/AEO scores, captured each time you run a scan (no cron, no external analytics).
* Fix: migration source detection could run an extremely slow database query on large sites (a multi-key meta lookup), which under a small PHP-FPM pool could tie up all workers. Rewritten as a single indexed query so opening the plugin — and running a migration — stays fast.
* Improved: the plugin now opens on the Dashboard, with a Dashboard / Settings switch in the header.

= 0.1.0 =
* Initial release: **Answer-Engine Readiness Score** (per-post 0–100 grade + actionable checklist in the block editor), title/meta templating, Open Graph & Twitter, canonical & robots, XML/HTML sitemaps, robots.txt, IndexNow, llms.txt, Agent Readiness Markdown export, JSON-LD schema (Article/WebPage/WebSite/Organization/FAQ), one-click migration from Yoast/Rank Math/SEOPress, optional WooCommerce Product schema, and a React admin app.
