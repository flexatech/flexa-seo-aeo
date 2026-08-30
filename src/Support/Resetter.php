<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Support;

defined( 'ABSPATH' ) || exit;

/**
 * Wipes all Flexa SEO data. Used by the Settings danger zone and the
 * `wp flexa-seo-aeo reset` CLI command — one helper keeps both paths in sync
 * so they can never drift.
 *
 * When later phases add custom tables (e.g. redirects, 404 log), extend this
 * to drop them too (see Install\Migrator::drop()).
 */
final class Resetter {
	/**
	 * @return array{settings_removed:bool}
	 */
	public static function reset_all(): array {
		$removed = delete_option( Settings::OPTION_KEY );

		if ( class_exists( \Flexa\SeoAeo\Install\Migrator::class ) ) {
			\Flexa\SeoAeo\Install\Migrator::drop();
		}

		do_action( 'flexa_seo_aeo/data_reset' );

		return [
			'settings_removed' => (bool) $removed,
		];
	}
}
