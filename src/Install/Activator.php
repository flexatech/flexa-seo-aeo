<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Install;

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

		// Sitemaps and the /llms.txt route are served through custom rewrite
		// rules registered on init; flush once on activation so they resolve
		// without the user having to re-save permalinks.
		flush_rewrite_rules();
	}
}
