<?php
/**
 * Plugin Name:       Flexa AEO – AI SEO & Answer Engine Optimization
 * Description:       Privacy-first WordPress SEO built AEO/GEO-first: titles & metas, Open Graph, sitemaps, and native llms.txt / Agent Readiness for AI answer engines.
 * Version:           0.1.0
 * Requires at least: 6.5
 * Tested up to:      7.1
 * Requires PHP:      8.2
 * Author:            FlexaTech
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       flexa-seo-aeo
 * Domain Path:       /i18n/languages
 * WC requires at least: 8.0
 * WC tested up to:   11.0
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

if ( version_compare( PHP_VERSION, '8.2', '<' ) ) {
	add_action(
		'admin_notices',
		static function (): void {
			echo '<div class="notice notice-error"><p>';
			echo esc_html__( 'Flexa AEO requires PHP 8.2 or higher. The plugin has been disabled.', 'flexa-seo-aeo' );
			echo '</p></div>';
		}
	);
	return;
}

define( 'FLEXA_SEO_AEO_VERSION', '0.1.0' );
define( 'FLEXA_SEO_AEO_FILE', __FILE__ );
define( 'FLEXA_SEO_AEO_PATH', plugin_dir_path( __FILE__ ) );
define( 'FLEXA_SEO_AEO_URL', plugin_dir_url( __FILE__ ) );
define( 'FLEXA_SEO_AEO_BASENAME', plugin_basename( __FILE__ ) );
define( 'FLEXA_SEO_AEO_REST_NAMESPACE', 'flexa-seo-aeo/v1' );
define( 'FLEXA_SEO_AEO_TEXT_DOMAIN', 'flexa-seo-aeo' );

if ( file_exists( FLEXA_SEO_AEO_PATH . 'vendor/autoload.php' ) ) {
	require_once FLEXA_SEO_AEO_PATH . 'vendor/autoload.php';
} else {
	spl_autoload_register(
		static function ( string $class_name ): void {
			$prefix = 'Flexa\SeoAeo\\';
			if ( ! str_starts_with( $class_name, $prefix ) ) {
				return;
			}
			$relative = substr( $class_name, strlen( $prefix ) );
			$file     = FLEXA_SEO_AEO_PATH . 'src/' . str_replace( '\\', '/', $relative ) . '.php';
			if ( is_readable( $file ) ) {
				require $file;
			}
		}
	);
}

add_action(
	'before_woocommerce_init',
	static function (): void {
		if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', FLEXA_SEO_AEO_FILE, true );
		}
	}
);

register_activation_hook( __FILE__, [ \Flexa\SeoAeo\Install\Activator::class, 'activate' ] );
register_deactivation_hook( __FILE__, [ \Flexa\SeoAeo\Install\Deactivator::class, 'deactivate' ] );

add_action(
	'plugins_loaded',
	static function (): void {
		\Flexa\SeoAeo\Plugin::instance()->boot();
	}
);
