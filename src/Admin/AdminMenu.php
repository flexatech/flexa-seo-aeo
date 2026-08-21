<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Admin;

use Flexa\SeoAeo\Support\Settings;
use Flexa\SeoAeo\Support\SingletonTrait;

defined( 'ABSPATH' ) || exit;

final class AdminMenu {
	use SingletonTrait;

	public const SLUG = 'flexa-seo-aeo';

	public function register(): void {
		add_action( 'admin_menu', [ $this, 'register_menu' ] );
		add_filter( 'plugin_action_links_' . FLEXA_SEO_AEO_BASENAME, [ $this, 'action_links' ] );
	}

	/**
	 * Prepend a "Settings" link on the Plugins list row, pointing at this
	 * plugin's admin page.
	 *
	 * @param array<int|string, string> $links
	 * @return array<int|string, string>
	 */
	public function action_links( array $links ): array {
		$settings = sprintf(
			'<a href="%s">%s</a>',
			esc_url( admin_url( 'admin.php?page=' . self::SLUG ) ),
			esc_html__( 'Settings', 'flexa-seo-aeo' )
		);

		array_unshift( $links, $settings );

		return $links;
	}

	public function register_menu(): void {
		// White-label aware: the brand name follows the whitelabel setting. Not a
		// translated literal because it can be a user-supplied string.
		$brand = Settings::brand_name();

		add_menu_page(
			$brand,
			$brand,
			'manage_options',
			self::SLUG,
			[ $this, 'render_page' ],
			'dashicons-search',
			81
		);
	}

	public function render_page(): void {
		$template = FLEXA_SEO_AEO_PATH . 'views/admin-app.php';
		if ( is_readable( $template ) ) {
			require $template;
		}
	}
}
