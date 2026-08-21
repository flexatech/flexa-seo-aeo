# Flexa AEO — Code Style (distilled)

Mirror `../flexa-cache/` exactly when in doubt. This is the short spec.

## PHP
- File head: `<?php` · blank line · `declare(strict_types=1);`.
- After `namespace` + `use`s, before the class: `defined( 'ABSPATH' ) || exit;`. `uninstall.php` uses `WP_UNINSTALL_PLUGIN`.
- PSR-4, one class per file, `Flexa\SeoAeo\` → `src/`.
- Every concrete class `final`; base classes `abstract`; stateless services `use Support\SingletonTrait` accessed via `::instance()`.
- All properties typed; value objects `public readonly` with constructor promotion.
- Explicit param + return types always. Silence a required-but-unused hook param with `unset( $request );` as the first line.
- Docblocks sparse — only non-trivial logic or array shapes (`@param array<string,mixed>`, `@return list<...>`). No file/class docblocks normally.
- Constants `UPPER_SNAKE`; the bootstrap `define()` block is the only place `FLEXA_SEO_AEO_*` is set.
- Hooks: `do_action( 'flexa_seo_aeo/domain/event', … )`. Extension seams already wired: `flexa_seo_aeo/rest/register_routes`, `flexa_seo_aeo/settings/updated`, `flexa_seo_aeo/data_reset`, `flexa_seo_aeo/capabilities/*`.
- REST: namespace via `BaseRestController::NAMESPACE`; **every** route has a real `permission_callback`; handlers return `WP_REST_Response|WP_Error`; new up every controller in `Rest\RegisterFacade::register_routes()` (an unregistered controller is dead code).
- Permissions only via `Support\Capabilities` (`can_manage()` ≈ `edit_posts` for per-post SEO, `can_manage_settings()` ≈ `manage_options`).
- Settings: one option `flexa_seo_aeo_settings`; schema/defaults/sanitizer in `Support\Settings`; REST delegates to it; partial-update merge over stored; fires `flexa_seo_aeo/settings/updated` ($new, $old). Nested groups (e.g. `aeo`) merge internally so a one-toggle save never wipes the group.
- DB (later phases): all SQL inside `Domain/*Repository`, `$wpdb->prepare()` always.
- Destructive: only `Support\Resetter::reset_all()` — shared by REST danger zone + CLI; never inline a second delete.
- CLI: `Cli\*Command::register()` guarded by `class_exists( WP_CLI::class )`; `@when after_wp_load`; format via `\WP_CLI\Utils\format_items()`.

## TypeScript / React (Phase 4 — pair with `flexa-plugin-ui`)
- Strict TS, no `any`. Server state → TanStack Query; UI/ephemeral → Zustand (persist key `flexa-seo-aeo:ui`). Never mix.
- Query keys resource-first array: `["settings"]`, `["sitemap","stats"]`.
- Mutations: optimistic `onMutate` → `onError` rollback → `onSettled` invalidate.
- i18n via `@/lib/i18n`, text-domain `flexa-seo-aeo`, literal strings only.
- `cn()` for class merging; every Tailwind class carries the `fsa:` prefix.
- Every mount wrapped in `<AppProviders>`; root id `flexa-seo-aeo-admin-root`; js global `window.flexaSeoAeo`.

## Gotchas
- A REST controller not added to `RegisterFacade` is silently dead.
- `update_settings` must sanitize against the schema **and** merge over stored (partial updates).
- Hooks use slashes; never convert to underscores to satisfy phpcs.
- Pro relies on file *absence*, not a runtime flag — never ship disabled Free-side code behind `if ($pro_enabled)`.
