<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Install;

use Flexa\SeoAeo\Admin\ActivationRedirect;
use Flexa\SeoAeo\Support\OnboardingState;
use Flexa\SeoAeo\Support\Settings;

defined( 'ABSPATH' ) || exit;

final class Activator {
	public static function activate(): void {
		if ( class_exists( Migrator::class ) ) {
			Migrator::migrate();
		}

		if ( get_option( Settings::OPTION_KEY, null ) === null ) {
			add_option( Settings::OPTION_KEY, Settings::defaults() );
		}

		// Offer the Setup Assistant on first activation. A short, user-scoped
		// transient is the safe way to trigger a one-time redirect: activation
		// runs sandboxed, so the actual redirect happens later on admin_init (see
		// ActivationRedirect). Skipped once the user has finished or dismissed
		// setup, so re-activating a configured site never hijacks the admin.
		if ( ! OnboardingState::is_finished() ) {
			set_transient( ActivationRedirect::REDIRECT_TRANSIENT, get_current_user_id(), MINUTE_IN_SECONDS );
		}

		// Sitemaps and the /llms.txt route are served through custom rewrite
		// rules registered on init; flush once on activation so they resolve
		// without the user having to re-save permalinks.
		flush_rewrite_rules();
	}
}
