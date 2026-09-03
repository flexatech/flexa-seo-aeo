# Flexa SEO – AEO: Onboarding / Setup Assistant Design

Status: design approved, not implemented.
Scope: design and implementation roadmap only. No code ships with this document.
Audience: the implementer (human or coding model) and reviewers.

## 1. Overview and philosophy

The Setup Assistant turns first-run configuration into a short guided flow built on one loop:

**Detect → Recommend → One-click Apply → Measure → Improve**

Principles:

- Adaptive, not a fixed wizard. Steps that do not apply to a site are skipped entirely.
- Never ask for what can be detected. Site name, language, WooCommerce, existing SEO plugins and current Flexa configuration are read, not typed.
- Recommended settings instead of exposed settings. The wizard applies a curated, safe set with one click. Advanced configuration stays in the Settings page.
- The star is AEO. The differentiator screen explains that Flexa does not just generate `llms.txt`; it measures how quotable and readable content is for AI answer engines, and it shows a live readiness score when possible.
- At most 5 screens in the normal flow. The final report counts as a screen. The migration step is conditional and excluded from the count.
- Measurement continues after setup: the wizard hands its findings to the Dashboard as actionable items.

Everything below reuses existing plugin infrastructure wherever possible. The complete new REST surface is three routes. The complete new persistent state is one option.

## 2. Architecture

### 2.1 Mount strategy: a third app view, rendered as a full-screen takeover

The admin app (`apps/admin`) has no router. It switches between two views, `"dashboard"` and `"settings"`, through the Zustand store (`apps/admin/src/lib/store.ts`). The wizard becomes a third view:

- Add `"setup"` to the `AppView` union in `store.ts`.
- When `view === "setup"`, `App.tsx` renders `<OnboardingPage />` instead of the brand strip and tab shell. The wizard supplies its own minimal header: brand chip, step indicator, and an "Exit setup" link.
- A URL parameter `?fsa-view=setup` on `admin.php?page=flexa-seo-aeo` is read once in `App.tsx` on mount and overrides the persisted view. This is the deep link used by the activation redirect, the plugins-screen notice, and all re-entry points.

Rejected alternatives:

- **Radix Dialog modal.** A 5-screen flow with scan progress, diff previews and a batched migration runner is too much for a portaled modal. Esc/overlay-close semantics fight resume state, and portals re-open the wp-admin CSS override problems for no benefit. Dialogs stay confirmations; the Apply diff confirm reuses `components/ui/dialog.tsx`.
- **A second WP admin page.** One Vite entry, one enqueue hook, one page today. A second page means a second bundle or page sniffing. The Zustand view switch is how the app already navigates, and the shared TanStack Query cache keeps the report and the Dashboard in sync for free.

State interplay: the UI store persists `view` in localStorage. That is desirable for resume (a reload lands back in setup), but the server-side onboarding option is the source of truth. On mount, if the persisted view is `"setup"` but `GET /onboarding` reports `completed` or `dismissed`, the shell forces `setView("dashboard")`.

### 2.2 Trigger: activation transient plus guarded redirect, with a notice fallback

`src/Install/Activator.php` currently seeds the settings option and flushes rewrites; there is no redirect or welcome transient anywhere. Additions:

1. `Activator::activate()` sets `set_transient( 'flexa_seo_aeo_activation_redirect', get_current_user_id(), 60 )`, but only when the onboarding option does not already report `completed` or `dismissed`. Re-activating a configured install must not redirect. Never redirect inside activation itself (WP runs it sandboxed).
2. New `src/Admin/ActivationRedirect.php` (singleton, booted from `src/Plugin.php`) hooks `admin_init`:
   - Read the transient and delete it immediately (one shot, even if a guard fails).
   - Bail if any of: `wp_doing_ajax()`, `is_network_admin()`, `isset( $_GET['activate-multi'] )` (bulk activation), transient user ID differs from `get_current_user_id()`, `! Capabilities::can_manage_settings()`, or onboarding status is `completed`/`dismissed`.
   - Otherwise `wp_safe_redirect( admin_url( 'admin.php?page=flexa-seo-aeo&fsa-view=setup' ) ); exit;`
   - Multisite: network activation runs per site; the `is_network_admin()` guard plus the 60-second per-site transient make bad redirects impossible. No network-wide UX in MVP.
3. Notice fallback for paths the redirect cannot cover (bulk activate, WP-CLI, multisite): a dismissible admin notice rendered only on `plugins.php`, only for users with `manage_options`, only while status is `pending`. Copy: "Flexa SEO is active. Run the 3-minute Setup Assistant." Dismissing (nonce-checked GET handled on `admin_init`) records `dismissed_at` in the onboarding option, which also silences the Dashboard card's nag state. The plugin's own page never shows the notice; the Dashboard setup card covers it there.

### 2.3 Lifecycle rules

- **Permission.** Everything is gated on the SETTINGS capability: `Capabilities::can_manage_settings()` (`manage_options`, filterable via `flexa_seo_aeo/capabilities/settings`). Editors never see the wizard, the Dashboard setup card, or any `/onboarding` request.
- **Resume.** Every step transition persists `current_step` and `completed_steps` to the server (fire-and-forget POST). Abandoning mid-flow and returning resumes at the recorded step.
- **Re-run.** The Setup Assistant can always be reopened (Settings → Tools, Dashboard card, command palette). Re-running never reverts anything: the compare-to-defaults rule (section 4.2) means Apply proposes only still-unconfigured values, and the diff preview shows exactly what will change before anything is written.
- **Exit.** "Exit setup" is always available, saves progress, and returns to the Dashboard.

## 3. Detection: `GET /onboarding`

One endpoint returns state, detection and recommendations in a single round trip; the wizard needs all three at boot. Permission: `settings_permission` from `BaseRestController`. All detection is server-side, cheap and read-only.

| Field | Source | Notes |
|---|---|---|
| `site_name` | `get_bloginfo( 'name' )` | never ask the user |
| `tagline` | `get_bloginfo( 'description' )` | prefill candidate for `aeo.site_description` |
| `site_url` | `home_url( '/' )` | display only |
| `language` | `determine_locale()` | display only |
| `logo_url` | `wp_get_attachment_image_url( (int) get_theme_mod( 'custom_logo' ), 'full' )`, fallback `get_site_icon_url()` | shown on the welcome screen; not written to settings in MVP |
| `has_woocommerce` | `class_exists( 'WooCommerce' )` | same check as `Enqueue.php` |
| `site_type` | heuristic: Woo present → `"shop"`; else published posts > 5 → `"blog"`; else `"site"` | `wp_count_posts()` is cached by core |
| `posts_published`, `pages_published` | `wp_count_posts( 'post' )->publish`, `wp_count_posts( 'page' )->publish` | drives adaptive skipping |
| `latest_post_id` | `get_posts` limit 1, `orderby=date` | for the AEO live preview; `null` when no posts |
| `pretty_permalinks` | `get_option( 'permalink_structure' ) !== ''` | warning chip: sitemap and `/llms.txt` need rewrites |
| `knowledge_type_suggestion` | always `"organization"` | Person is a deliberate manual choice; do not guess |
| `seo_plugins` | `Migrator::instance()->sources()` counts merged with active-plugin checks | see below |
| `settings_configured` | deep compare `Settings::all()` against `Settings::defaults()` | drives the "already configured" adaptation |

`seo_plugins` entries have the shape `{ id: "yoast"|"rankmath", label, active: bool, migratable: bool, count: int }`:

- `count` and `migratable` come from the existing `Migrator` source detection, which already uses the safe single-JOIN `meta_key IN (...)` query pattern. No new query surface.
- `active` uses `is_plugin_active( 'wordpress-seo/wp-seo.php' )` / `is_plugin_active( 'seo-by-rank-math/rank-math.php' )`. In REST context, guard with `if ( ! function_exists( 'is_plugin_active' ) ) { include_once ABSPATH . 'wp-admin/includes/plugin.php'; }`.
- `active: true` renders a conflict warning on the welcome screen (duplicate meta tags). `migratable: true` enables the migration step.
- SEOPress is not listed: `LegacyMapper` does not support it yet (deferred, section 10). The read-time fallback keys in `PostMetaRepository` are not a migration path.

### Response schema

```jsonc
// GET /flexa-seo-aeo/v1/onboarding   (manage_options)
{
  "state": {                       // section 7; persisted option, coerced to full shape
    "version": 1,
    "status": "pending",           // pending | in_progress | completed | dismissed
    "current_step": "welcome",
    "completed_steps": [],
    "applied": { "seo": [], "aeo": [] },
    "started_at": null, "completed_at": null, "dismissed_at": null
  },
  "detect": {
    "site_name": "…", "tagline": "…", "site_url": "…", "language": "vi",
    "logo_url": "…",               // or null
    "site_type": "shop",           // shop | blog | site
    "has_woocommerce": true, "pretty_permalinks": true,
    "posts_published": 42, "pages_published": 8, "latest_post_id": 123,
    "knowledge_type_suggestion": "organization",
    "seo_plugins": [
      { "id": "yoast", "label": "Yoast SEO", "active": false, "migratable": true, "count": 120 }
    ],
    "settings_configured": false
  },
  "recommended": {                 // section 4; computed fresh on every GET
    "seo": [
      { "key": "titles_metas", "label": "Titles & meta descriptions",
        "current": false, "recommended": true, "state": "will_enable" }
    ],
    "aeo": [ { "key": "aeo.schema", "label": "…", "current": false, "recommended": true, "state": "will_enable" } ]
  }
}
```

Nothing from `detect` or `recommended` is ever persisted. Both are recomputed on every GET, so a re-run always sees current reality and there is no snapshot drift.

## 4. Recommended-settings engine

Computed in a new `src/Services/Onboarding/Recommended.php` (singleton, mirrors existing service patterns).

### 4.1 The recommended set

| Setting | Recommended value | Condition |
|---|---|---|
| `titles_metas` | `true` | always |
| `xml_sitemap` | `true` | always |
| `open_graph` | `true` | always |
| `twitter_cards` | `true` | always |
| `knowledge_type` | `"organization"` | only if current equals default and `knowledge_name` is empty |
| `knowledge_name` | detected `site_name` | only if currently `""` |
| `aeo.enabled` | `true` | always |
| `aeo.schema` | `true` | always |
| `aeo.agent_readiness` | `true` | always |
| `aeo.plain_text_export` | `true` | always |
| `aeo.commerce` | `true` | only if `has_woocommerce` |
| `aeo.site_description` | detected `tagline` | only if currently `""` and tagline non-empty |

Deliberately excluded from Apply (they stay Settings-only, or appear as "next actions" on the report): `breadcrumbs` (theme markup dependent), `image_seo_alt` (mutates output semantics), `indexnow` (external pinging is opt-in), `html_sitemap`, `xml_sitemap_images`, `whitelabel`, `robots_txt`, `og_default_image` (deferred). The Apply set is minimal, reversible and safe; the wizard must not become a settings page.

### 4.2 "Unconfigured vs user-changed": the compare-to-defaults rule

There is no baseline snapshot, and every boolean in `Support/Settings.php::defaults()` is `false`. The rule:

> A setting counts as **user-configured** if and only if its current coerced value differs from `Settings::defaults()` (per key; for `aeo.*` per nested key). Apply only ever touches keys whose current value equals the default.

Consequences:

- For booleans, Apply only turns things on that are currently off-by-default. It never flips anything off and never overwrites a non-default value.
- For strings (`knowledge_name`, `aeo.site_description`), prefill happens only when the current value is `""`.
- Known edge case, accepted: a user who toggled a feature on and back off is indistinguishable from one who never touched it. Mitigation is the mandatory diff preview. Apply never fires blind; the confirm dialog lists exactly the keys that will change.

Each recommended item carries one of three states, driving both the row rendering and the Apply payload:

- `will_enable`: current equals default, recommendation differs. Included in Apply.
- `already_on`: current already equals the recommendation. Rendered with a check mark.
- `user_configured_skip`: current differs from default and from the recommendation. Rendered with a lock icon and "kept as you set it". Never included in Apply.

Chosen over a `configured_at` / first-save flag because it needs zero new tracking in the settings write path, is retroactively correct for installs that predate onboarding, and cannot drift from reality.

### 4.3 Apply mechanism: reuse `POST /settings`

There is no `/onboarding/apply` endpoint. The client takes the `will_enable` items for the current scope, builds the minimal partial payload (a nested `aeo` object for `aeo.*` keys; the existing sanitizer merges partial `aeo` over stored values), and sends it through the existing `POST /settings` route. This keeps a single sanitize/merge path, fires the existing `flexa_seo_aeo/settings/updated` action, and matches the app's diff-only save convention.

After success the client invalidates the `["settings"]` and `["onboarding"]` queries, then POSTs `/onboarding` to append the step to `completed_steps` and record the changed keys under `applied.{scope}`. The two calls are not atomic; that is acceptable, because the second call is bookkeeping only. A lost update just re-shows a completed step as current, which resume handles.

## 5. Screen-by-screen specification

Step order: `welcome → seo → aeo → content → migration → report`. Migration is conditional and comes after the content scan so migrated data does not skew the sample. New frontend code lives under `apps/admin/src/features/onboarding/`.

Shared wizard chrome (`OnboardingPage.tsx` + `WizardShell.tsx` + `Stepper.tsx`):

```
┌──────────────────────────────────────────────────────────────┐
│ [✦ brand chip]  Setup Assistant            Exit setup ✕      │
│ ●──●──○──○──○   Step 2 of 5 · Search essentials              │
├──────────────────────────────────────────────────────────────┤
│                 (step card, max-w-3xl, centered)             │
├──────────────────────────────────────────────────────────────┤
│ [← Back]                          [Skip for now]  [Primary →]│
└──────────────────────────────────────────────────────────────┘
```

Conventions for every screen:

- Cards use the existing tokens: `fsa:rounded-xl fsa:border fsa:border-slate-200 fsa:bg-white fsa:shadow-sm` plus dark-mode variants.
- Reused UI kit: `Button`, `Switch` (only where a real choice exists), `Select`, `Input`, `Label`, `Dialog` (Apply confirm), `Tooltip`. Lucide icons. Status colors emerald/amber/red. All strings via `__()` literals from `lib/i18n.ts`.
- Step transitions fire a fire-and-forget `POST /onboarding { current_step, completed_steps, status: "in_progress" }` so abandonment resumes correctly.
- Boot: the wizard loads on `useQuery(["onboarding"])` with a skeleton card until resolved. Global error state: card with an alert icon, message, Retry (refetch). "Exit setup" always works.

### 5.1 Screen 1: Welcome & Site Detection (`WelcomeStep.tsx`)

```
  (logo_url or ✦)  "Let's make {site_name} answer-engine ready"
  "We detected your setup. Nothing to fill in."

  ┌ Detected ─────────────────────────────────────────────┐
  │ 🌐 {site_url}            🗣 Language: {language}       │
  │ 🏷 Type: Shop (WooCommerce detected)                  │
  │ 👤 Represents: Organization "{site_name}"   [change ▾]│
  │ 🔎 Existing SEO data: Yoast SEO (120 posts)           │
  │ ⚠ Yoast SEO is still active. Deactivate it after     │
  │   setup to avoid duplicate meta tags.                 │
  │ ⚠ Pretty permalinks are off. The sitemap and         │
  │   llms.txt need them. [Open Permalink Settings]       │
  └───────────────────────────────────────────────────────┘
  [Start setup →]        "≈ 3 minutes · you can exit anytime"
```

- The only editable control is the Represents row: a `Select` (Organization/Person) plus an `Input` for the name, pre-filled from detection. Edits feed into the recommended payload for the SEO step.
- Warning rows render only when their condition holds (`seo_plugins[].active`, `!pretty_permalinks`).
- If `detect.settings_configured`, the subtitle becomes "Flexa SEO is already partly configured. We'll only suggest what's missing."
- No Skip on this screen; it is the entry. "Start setup" sets `status: "in_progress"` and `started_at`.
- REST: none beyond the initial `GET /onboarding`.

### 5.2 Screen 2: SEO Recommended Setup (`SeoStep.tsx`)

```
  "Search essentials"  ·  "The baseline every site needs. One click."
  ┌───────────────────────────────────────────────────────┐
  │ ● Titles & meta descriptions      will be enabled     │
  │ ● XML sitemap                     will be enabled     │
  │ ● Open Graph (social sharing)     will be enabled     │
  │ ✓ Twitter / X cards               already on          │
  │ 🔒 Knowledge graph                kept as you set it  │
  └───────────────────────────────────────────────────────┘
  [Apply recommended settings]
  Secondary: [Skip for now]
```

- Rows come from `recommended.seo` and render by state: `will_enable` (brand dot), `already_on` (emerald check), `user_configured_skip` (lock, tooltip "kept as you set it"). One explanatory line per row via `Tooltip`; no toggles.
- Apply opens a `Dialog`: "These N settings will change:" with the exact key list, then Cancel/Apply. On success: success toast, button becomes "✓ Applied", primary CTA becomes Continue.
- Apply = `POST /settings` (partial payload, section 4.3) then `POST /onboarding`. Error: inline red banner plus toast, button re-enabled.
- Empty variant: when every row is `already_on`/`user_configured_skip`, show "Everything recommended is already enabled ✓", hide Apply, primary is Continue.
- No advanced settings. A single footer link "Fine-tune later in Settings → General" navigates after wizard exit, not during.

### 5.3 Screen 3: AEO Setup, the differentiator (`AeoStep.tsx`)

```
  🤖 "Make your content ready for AI answers"
  "ChatGPT, Perplexity and Google AI Overviews read sites
   differently. Flexa prepares yours in one click, then
   measures how quotable each post is."
  ┌───────────────────────────────────────────────────────┐
  │ ● Answer-readiness scoring for every post             │
  │ ● Structured data (Article, FAQ, HowTo)               │
  │ ● /llms.txt, a sitemap for AI engines                 │
  │ ● Markdown / plain-text alternates for agents         │
  │ ● Product data for AI shopping answers (WooCommerce)  │
  │ ✎ AI summary: "{tagline}"                    [edit]   │
  └───────────────────────────────────────────────────────┘
  [Enable AEO features]
```

- The commerce row renders only when `has_woocommerce`.
- The AI summary row is an `Input` pre-filled with the tagline (maps to `aeo.site_description`); editing is optional.
- Same states, diff-confirm dialog and `POST /settings` pattern as Screen 2, scoped to `recommended.aeo`.
- Live preview: only when `posts_published > 0`. After Apply succeeds, fetch the existing `GET /readiness/{latest_post_id}` and show an inline mini-card: "Your latest post '{title}' scores 62/100 for AI answers. We'll scan more next." On error or timeout the card is silently omitted; it never blocks Continue.

### 5.4 Screen 4: Content Readiness (`ContentStep.tsx`)

```
  "How ready is your content?"          [scanning 8 / 12 ▓▓▓░░]
  ┌── after scan ─────────────────────────────────────────┐
  │        Overall readiness: 58 / 100  (Fair)            │
  │   ● 3 good      ● 6 needs improvement     ● 3 poor    │
  │ ┌ Top pages needing attention ─────────────────────┐  │
  │ │ 34  "About us"           missing meta description│  │
  │ │ 41  "Shipping policy"    no structured data      │  │
  │ │ 47  "Hello world"        thin content            │  │
  │ └──────────────────────────────────────────────────┘  │
  │ ℹ You'll fix these from the Dashboard after setup.    │
  │   Each has one-click patches.                         │
  └───────────────────────────────────────────────────────┘
  [Continue →]  ·  [Skip scan]
```

- Mechanics in section 6. The screen renders instantly with the progress shell; batches fire only after render. Results accumulate live in the bucket counters; the table shows up to 5 lowest-scoring pages with score chip, title and worst failed check.
- Grade buckets: `excellent|good` → good, `fair` → needs improvement, `poor` → poor.
- Skip aborts the remaining batches cleanly (nothing was written). Error mid-scan: keep partial results plus an amber note "Scan incomplete. Retry from the Dashboard."
- Recommendations only; no fixing here. Fix UX already exists in the Dashboard readiness flow.
- This screen is skipped entirely (never appears in the stepper) when `posts_published + pages_published <= 2`.

### 5.5 Screen 5 (conditional): Migration (`MigrationStep.tsx`)

Shown only when at least one `seo_plugins[].migratable`. Reuses the existing migration machinery: extract the source-fetch and batch-loop logic from `features/settings/MigrationPane.tsx` into a shared `features/settings/useMigration.ts` hook consumed by both the pane and this step. Routes `GET /migrate/sources` and `POST /migrate` are unchanged.

```
  "Bring your Yoast SEO data over"
  "Titles, descriptions, social settings. 120 posts found."
  (•) Fill gaps only (recommended, keeps anything Flexa already has)
  ( ) Overwrite existing Flexa data
  [Migrate 120 posts] → "60 / 120 migrated…" → "✓ Done. 118 migrated, 2 skipped"
  Secondary: [Skip, I'll do this later in Settings → Tools]
```

- Multiple sources stack as separate cards (rare).
- Errors stop the batch loop and offer retry from the last offset.
- Skip records the step as done. `MigrationPane` in Settings remains the permanent home.

### 5.6 Screen 6: Final Readiness Report (`ReportStep.tsx`)

No confetti, no generic congratulations. A real report.

```
  "Your site's readiness report"
  [ SEO 72 ]   [ AEO 61 ]   [ Technical 90 ]
  ┌ Enabled during setup ─────────────────────────┐
  │ ✓ Titles & metas  ✓ Sitemap  ✓ OG/Twitter     │
  │ ✓ llms.txt  ✓ Structured data  ✓ Markdown     │
  └───────────────────────────────────────────────┘
  ┌ Recommended next actions ─────────────────────┐
  │ → Fix 3 posts missing meta descriptions       │
  │ → Add FAQ blocks to your key pages            │
  │ → Consider enabling breadcrumbs               │
  └───────────────────────────────────────────────┘
  [Go to Dashboard →]
```

- On mount, fire one `POST /dashboard/scan` (existing route) with a loading gauge: "Compiling your readiness report…". This seeds the dashboard transient and records the first trend snapshot, so the Dashboard the user lands on is warm and consistent with the report.
- Gauges reuse the Dashboard's visual language. "Enabled during setup" comes from `state.applied`. Next actions are the top 3 of the scan's `recommendations` (`{id, label, hint, severity, target}` shape from `SiteAudit`).
- If the site still has an active legacy SEO plugin, add a reminder chip: "Deactivate Yoast to avoid duplicate tags."
- On scan error: fall back to a settings-derived enabled-features list plus a "Run your first scan" CTA on the Dashboard.
- "Go to Dashboard" → `POST /onboarding { status: "completed", completed_at }`, `setView("dashboard")`, invalidate `["dashboard"]`.

## 6. Content readiness scan mechanics

Decision: a new batched read-only endpoint reusing `Readiness` per post, not `POST /dashboard/scan`. The dashboard scan (a) scores up to 50 posts synchronously, too heavy mid-wizard, (b) writes the transient and appends a trend snapshot, so an abandoned run would pollute the trend, and (c) offers no batching, hence no incremental progress UX.

```
GET /flexa-seo-aeo/v1/onboarding/scan?offset=0&batch=4     (manage_options)
→ { "total": 12, "offset": 0, "batch": 4, "done": false,
    "items": [ { "id": 34, "title": "About us", "url": "…", "score": 34,
                 "grade": "poor", "worst_check": "meta description missing" } ] }
```

- **Post selection:** one `WP_Query`: `post_type` `['post','page']`, `post_status=publish`, `orderby=modified`, `order=DESC`, `posts_per_page=batch`, `offset`, `fields=ids`. **No `meta_query` of any kind.** This is a date-ordered index scan and fully respects the production incident rule (a multi-key OR meta_query once caused a 504; any detection query must use single-JOIN `meta_key IN (...)` or, as here, none at all).
- **Scoring:** `Readiness::instance()` per ID. Stateless; one `the_content` render plus DOM parse each. A batch of 4 keeps each request comfortably fast on typical hosts.
- **Cap:** 12 posts total. Constant, filterable via `flexa_seo_aeo/onboarding/scan_limit`, hard cap 20.
- **Client loop:** the screen renders first, then a TanStack mutation loop fires sequential batches (same pattern as the migration batch runner). Progress bar shows "8 / 12 scanned". Skip aborts the loop; no cleanup needed because nothing is written.
- **Cache interplay:** none. This endpoint is read-only. The dashboard transient `flexa_seo_aeo_dashboard_report` and the trend option are untouched until the final report's `POST /dashboard/scan`.

## 7. State model and REST reference

### 7.1 Persistent state

New option `flexa_seo_aeo_onboarding`, managed by new `src/Support/OnboardingState.php`. The class mirrors the `Settings` pattern exactly: `OPTION_KEY` constant, `defaults()`, coercing `get()`, `sanitize()` that drops unknown keys and invalid enum values, `update( array $partial )` merging over stored.

```php
[
    'version'         => 1,                 // schema version for future migrations
    'status'          => 'pending',         // pending | in_progress | completed | dismissed
    'current_step'    => 'welcome',         // welcome | seo | aeo | content | migration | report
    'completed_steps' => [],                // list of step ids, deduped, validated against the enum
    'applied'         => [ 'seo' => [], 'aeo' => [] ], // setting keys the wizard changed
    'started_at'      => null,              // unix timestamp or null
    'completed_at'    => null,
    'dismissed_at'    => null,
]
```

Persisted: progress plus what Apply changed (not recomputable, needed for the report and transparency). Not persisted: detections, recommendations, scan results (all recomputable; no snapshot drift). `Support/Resetter::reset_all()` gains one line to delete this option, flowing through the existing `flexa_seo_aeo/data_reset` path.

### 7.2 REST reference (complete new surface)

All three routes live in one new `src/Rest/OnboardingController.php` extending `BaseRestController`, registered in `RegisterFacade::register_routes()`. A controller not registered there is dead code.

| Route | Method | Capability | Purpose |
|---|---|---|---|
| `/onboarding` | GET | manage_options | `{ state, detect, recommended }` (section 3) |
| `/onboarding` | POST | manage_options | partial state update (status, current_step, completed_steps, applied); returns full coerced state |
| `/onboarding/scan` | GET | manage_options | batched readiness sample (section 6) |

Reused as-is: `POST /settings` (Apply), `POST /dashboard/scan` (report), `GET /readiness/{id}` (live preview), `GET /migrate/sources` + `POST /migrate` (migration step).

### 7.3 Completion percentage (client-side)

```
applicable = [welcome, seo, aeo]
           + (content   if posts_published + pages_published > 2)
           + (migration if any seo_plugins[].migratable)
           + [report]
pct = round( 100 * |completed_steps ∩ applicable| / |applicable| )
```

Computed from `GET /onboarding` (`state` plus `detect`). The server stores no percentage; it would go stale when detection changes.

### 7.4 Recommendations flow

No onboarding-specific recommendation type. `SiteAudit`'s technical checks already emit "Enable X" recommendations whose `target` maps to a settings section, plus per-post gap recommendations. Anything the user skipped in the wizard resurfaces natively on the next dashboard scan. The setup card's "N recommended actions" count is the number of `recommended.*` items still in `will_enable` state; clicking routes to the wizard (resume) or, post-completion, to the relevant settings section. Zero new recommendation plumbing.

## 8. Dashboard and Settings integration

### 8.1 `SetupCard` on the Dashboard

New `features/dashboard/SetupCard.tsx`, mounted at the top of `DashboardPage.tsx`, above the gauges. Rendered only when `window.flexaSeoAeo.canManageSettings` (already localized in `src/Admin/Enqueue.php`); editors never fetch `/onboarding`. Uses the shared `useQuery(["onboarding"])`.

| Onboarding state | Card |
|---|---|
| `pending` | "**Set up Flexa SEO in 3 minutes.** Detect, recommend, one click." → [Start Setup Assistant] |
| `in_progress` | "**Setup 60% complete.** 2 recommended actions remaining" + slim progress bar → [Resume setup] (jumps to `current_step`) |
| `completed`, remaining `will_enable` > 0 | "**Setup complete.** 2 recommended settings still off" → [Review] · [Dismiss ✕] |
| `completed`, 0 remaining | compact single row "✓ Setup complete" with [Dismiss ✕] |
| `dismissed` | card not rendered |

Dismiss = `POST /onboarding { status: "dismissed" }` (records `dismissed_at`, keeps `completed_at` if set). Styling: standard card tokens plus a brand-tinted left border. No animation.

### 8.2 Re-entry points

1. Dashboard `SetupCard` buttons.
2. Settings → Tools section, next to the migration pane: a row "Setup Assistant. Re-run detection and recommendations" → [Open] (`setView("setup")`). Visible regardless of status; this is the permanent re-run home.
3. CommandPalette entry "Run Setup Assistant", gated on `canManageSettings`.

Re-run behavior: entering with `status: completed` keeps `completed_at` and resets `current_step` to `welcome`. Safety comes from the compare-to-defaults rule plus the diff preview; a re-run can only propose still-unconfigured values and never reverts anything.

## 9. Adaptive logic table

| Scenario | Detection signal | Flow adaptation |
|---|---|---|
| Fresh site, no content | `posts_published + pages_published <= 2` | Skip the content step (stepper shows 4 dots). Report adds next action "Publish your first answer-ready post". AEO live preview omitted (`latest_post_id: null`). |
| Established content site | posts > 5, no legacy SEO data | Default 5-step flow, no migration. `site_type: "blog"` copy on welcome. |
| WooCommerce shop | `has_woocommerce` | `site_type: "shop"`. AEO step adds the commerce row and shopping-answers messaging. `aeo.commerce` joins the recommended set. |
| Migrating from Yoast/RankMath | `seo_plugins[].migratable` | Migration step inserted (6 dots). If also `active: true`: conflict warning on welcome plus a reminder chip on the report. |
| Already-configured Flexa | `settings_configured: true` | Welcome subtitle "already partly configured". SEO/AEO rows mostly `already_on` / `user_configured_skip`. Apply hidden when nothing is `will_enable`. Flow becomes review → scan → report. |
| No pretty permalinks | `pretty_permalinks: false` | Warning chip on welcome and report with a link to `options-permalink.php`. Does not block Apply; features self-gate. |

## 10. MVP scope and deferred work

**MVP** is everything in sections 2 through 9: activation redirect plus plugins-screen notice; the three `/onboarding` routes; the 5 screens plus conditional Yoast/RankMath migration; Apply via `POST /settings` with compare-to-defaults and diff confirm; string prefills; the final report seeding the dashboard scan; `SetupCard`, Settings Tools row and palette entry; adaptive skipping.

**Deferred, deliberately:**

- **SEOPress migration.** Blocked on `LegacyMapper` support. Offering a wizard toggle before the mapper exists would be a lie. The read-fallback keys in `PostMetaRepository` are not a migration path.
- **`og_default_image` auto-fill from the logo.** Site icons are 512px squares; OG wants 1200×630. Show the logo on welcome, write nothing.
- **Site-type-specific setting templates** beyond `aeo.commerce`. Needs real differentiated defaults first.
- **Per-post fixes inside the wizard.** One-click patches already live in the readiness flow; duplicating them bloats the wizard.
- **Scheduled or background rescans.** The plugin has no cron and stays REST-driven.
- **Multisite network-wide setup UX.** MVP only guarantees correctness (no bad redirects). A network wizard is its own project.
- **`indexnow`, `breadcrumbs`, `image_seo_alt` in the recommended set.** These remain deliberate Settings choices.

## 11. Implementation roadmap

Each phase ends with verifiable acceptance criteria: concrete REST calls to make and UI states to observe. PHP code must pass phpstan level 6 and follow existing conventions (slash-style hook names, singleton via `SingletonTrait`).

### Phase 1: Backend (state, detection, endpoints, trigger)

Files:

- New: `src/Support/OnboardingState.php`, `src/Services/Onboarding/Detector.php`, `src/Services/Onboarding/Recommended.php`, `src/Rest/OnboardingController.php`, `src/Admin/ActivationRedirect.php`
- Edit: `src/Rest/RegisterFacade.php` (register the controller; mandatory), `src/Support/Resetter.php` (delete the onboarding option), `src/Install/Activator.php` (activation transient), `src/Plugin.php` (boot ActivationRedirect)

Acceptance criteria:

- `GET /wp-json/flexa-seo-aeo/v1/onboarding` as admin returns the section 3 schema with correct live values. Toggling WooCommerce active/inactive flips `has_woocommerce` and the `aeo.commerce` recommendation. As editor it returns 403.
- `POST /onboarding {"status":"in_progress","current_step":"seo"}` persists; a subsequent GET reflects it. Unknown keys and invalid enum values are dropped.
- `GET /onboarding/scan?offset=0&batch=4` returns at most 4 scored items plus `total` and `done`. The query log shows no `meta_query` and no multi-key OR joins.
- Activating the plugin alone as admin lands on `admin.php?page=flexa-seo-aeo&fsa-view=setup` exactly once; a later visit to `plugins.php` does not redirect. Bulk activation (`activate-multi`) does not redirect; the notice appears on `plugins.php`; dismissing it sets `dismissed_at` and it never returns.
- `POST /settings/reset` clears `flexa_seo_aeo_onboarding`.

### Phase 2: Wizard shell and resume

Files:

- Edit: `apps/admin/src/lib/store.ts` (add `"setup"` to `AppView`), `apps/admin/src/app/App.tsx` (takeover branch, one-time `fsa-view` URL param read)
- New: `apps/admin/src/features/onboarding/OnboardingPage.tsx`, `WizardShell.tsx`, `Stepper.tsx`, `useOnboarding.ts` (query, step-advance mutation, applicable-steps derivation)

Acceptance criteria:

- `?fsa-view=setup` opens the takeover with no tab nav visible. Exit returns to the Dashboard.
- Reloading mid-wizard resumes on the server-recorded `current_step`.
- With status `completed` or `dismissed`, a stale persisted `view: "setup"` falls through to the Dashboard.
- `pnpm type-check` and `pnpm build` are clean.

### Phase 3: Screens 1-3 and the Apply flow

Files:

- New: `features/onboarding/WelcomeStep.tsx`, `SeoStep.tsx`, `AeoStep.tsx`, `RecommendationList.tsx`, `ApplyConfirmDialog.tsx`
- Apply wiring through the existing settings mutation pattern (partial payload; invalidate `["settings"]` and `["onboarding"]`)

Acceptance criteria:

- On a default install, the SEO step lists at least 4 `will_enable` rows. Apply shows the confirm dialog enumerating the exact keys. After Apply, `GET /settings` shows only those keys changed and the step re-renders all-green.
- Pre-setting `open_graph: true` manually, then re-running, shows that row as "kept as you set it" and the Apply payload omits it.
- With WooCommerce active the commerce row is present; inactive, absent.
- The AEO live preview appears only when a post exists and never blocks Continue on failure.

### Phase 4: Content scan and migration step

Files:

- New: `features/onboarding/ContentStep.tsx`, `MigrationStep.tsx`
- New: `features/settings/useMigration.ts`, extracted from `MigrationPane.tsx`; the pane is refactored to consume the hook with identical behavior

Acceptance criteria:

- The content screen renders instantly; the progress bar advances per batch (network tab shows sequential `/onboarding/scan` calls). Buckets and the top-pages table populate. Skip aborts mid-scan cleanly.
- A site with 0 posts never shows the content step.
- With Yoast meta present, the migration step appears and migrates with live progress via the existing `/migrate` route. `MigrationPane` in Settings still works unchanged.
- After a wizard scan, the dashboard transient `flexa_seo_aeo_dashboard_report` is absent or unchanged (verify in the database).

### Phase 5: Report, Dashboard integration, polish

Files:

- New: `features/onboarding/ReportStep.tsx`, `features/dashboard/SetupCard.tsx`
- Edit: `features/dashboard/DashboardPage.tsx` (mount SetupCard, gated on `canManageSettings`), `features/settings/SettingsPage.tsx` (Tools row "Setup Assistant"), CommandPalette registry
- Passes: i18n (all literals through `__()`), dark mode, keyboard and a11y (stepper `aria-current`, focus moves to the step heading on advance)

Acceptance criteria:

- Finishing the wizard fires exactly one `POST /dashboard/scan` and lands on a warm Dashboard (no second scan on load) with trend snapshot #1 recorded.
- SetupCard shows the correct state matrix from section 8.1 (test pending, in-progress percentage, complete-with-actions, dismissed), with the percentage matching the section 7.3 formula.
- Editors never see the card and no `/onboarding` request appears in their network tab.
- Re-running from Settings → Tools proposes only still-unconfigured values.
- `pnpm build` clean; new PHP passes phpstan level 6.

## 12. Critical file reference

| File | Why it matters |
|---|---|
| `src/Support/Settings.php` | `defaults()` is the baseline for the compare-to-defaults rule; the sanitize/merge contract Apply relies on |
| `src/Rest/RegisterFacade.php` | the new OnboardingController must be registered here or it is silently dead |
| `src/Support/Capabilities.php` | `can_manage_settings()` gates every onboarding surface |
| `src/Services/Aeo/Readiness.php` | per-post scoring reused verbatim by the wizard scan and live preview |
| `src/Services/Aeo/SiteAudit.php` | dashboard aggregate; the final report seeds it via `POST /dashboard/scan`; the wizard scan must not touch its transient or trend |
| `src/Services/Migration/Migrator.php` | `sources()` reused for detection counts; `migrate()` reused by the migration step |
| `src/Install/Activator.php` | gains the activation transient |
| `apps/admin/src/lib/store.ts` | `AppView` union plus persist partialize; the wizard mounts as the third view |
| `apps/admin/src/app/App.tsx` | takeover branch plus `fsa-view` deep-link boot |
| `apps/admin/src/features/settings/MigrationPane.tsx` | source of the extracted `useMigration.ts` hook |
| `src/Admin/Enqueue.php` | `canManageSettings` already localized for the frontend gate |
