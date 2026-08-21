<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Cli;

use Flexa\SeoAeo\Support\Resetter;
use Flexa\SeoAeo\Support\Settings;
use WP_CLI;

defined( 'ABSPATH' ) || exit;

/**
 * WP-CLI commands for Flexa AEO.
 *
 *     wp flexa-seo-aeo status
 *     wp flexa-seo-aeo reset [--yes]
 *     wp flexa-seo-aeo ping
 */
final class PluginCommand {
	public static function register(): void {
		if ( ! class_exists( WP_CLI::class ) ) {
			return;
		}
		WP_CLI::add_command( 'flexa-seo-aeo', self::class );
	}

	/**
	 * Show which modules are enabled.
	 *
	 * @param array<int, string>    $args
	 * @param array<string, string> $assoc
	 * @when after_wp_load
	 */
	public function status( array $args, array $assoc ): void {
		unset( $args, $assoc );

		$aeo = Settings::get( 'aeo' );
		$aeo = is_array( $aeo ) ? $aeo : [];

		\WP_CLI\Utils\format_items(
			'table',
			[
				[
					'module'  => 'titles_metas',
					'enabled' => (bool) Settings::get( 'titles_metas' ) ? 'yes' : 'no',
				],
				[
					'module'  => 'open_graph',
					'enabled' => (bool) Settings::get( 'open_graph' ) ? 'yes' : 'no',
				],
				[
					'module'  => 'twitter_cards',
					'enabled' => (bool) Settings::get( 'twitter_cards' ) ? 'yes' : 'no',
				],
				[
					'module'  => 'xml_sitemap',
					'enabled' => (bool) Settings::get( 'xml_sitemap' ) ? 'yes' : 'no',
				],
				[
					'module'  => 'html_sitemap',
					'enabled' => (bool) Settings::get( 'html_sitemap' ) ? 'yes' : 'no',
				],
				[
					'module'  => 'breadcrumbs',
					'enabled' => (bool) Settings::get( 'breadcrumbs' ) ? 'yes' : 'no',
				],
				[
					'module'  => 'aeo.llms_txt',
					'enabled' => ! empty( $aeo['enabled'] ) ? 'yes' : 'no',
				],
				[
					'module'  => 'aeo.agent_readiness',
					'enabled' => ! empty( $aeo['agent_readiness'] ) ? 'yes' : 'no',
				],
			],
			[ 'module', 'enabled' ]
		);
	}

	/**
	 * Wipe all Flexa AEO settings (danger zone). Routes through the shared
	 * Resetter so CLI and the REST danger zone never drift.
	 *
	 * ## OPTIONS
	 *
	 * [--yes]
	 * : Skip the confirmation prompt.
	 *
	 * @param array<int, string>    $args
	 * @param array<string, string> $assoc
	 * @when after_wp_load
	 */
	public function reset( array $args, array $assoc ): void {
		unset( $args );

		WP_CLI::confirm( 'This will delete all Flexa AEO settings. Continue?', $assoc );

		$result = Resetter::reset_all();
		WP_CLI::success(
			$result['settings_removed']
				? 'Flexa AEO settings removed.'
				: 'No Flexa AEO settings were stored.'
		);
	}

	/**
	 * Ping. Smoke-test that the command is wired.
	 *
	 * @param array<int, string>    $args
	 * @param array<string, string> $assoc
	 * @when after_wp_load
	 */
	public function ping( array $args, array $assoc ): void {
		unset( $args, $assoc );
		WP_CLI::success( sprintf( 'Flexa AEO v%s is alive.', FLEXA_SEO_AEO_VERSION ) );
	}
}
