<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Actions\Sitemap;

use Flexa\SeoAeo\Services\Sitemap as SitemapService;
use Flexa\SeoAeo\Support\Settings;
use Flexa\SeoAeo\Support\SingletonTrait;

defined( 'ABSPATH' ) || exit;

/**
 * Human-readable sitemap exposed through the `[flexa_sitemap]` shortcode. Reuses
 * the same {@see SitemapService} tree as the XML sitemap so the two never drift.
 * The Gutenberg block wrapper is deferred to the Phase 4 admin/build step; the
 * shortcode works in the classic editor, widgets, and block "Shortcode" blocks.
 */
final class HtmlSitemap {
	use SingletonTrait;

	public function register(): void {
		if ( ! (bool) Settings::get( 'html_sitemap' ) ) {
			return;
		}

		add_shortcode( 'flexa_sitemap', [ $this, 'render' ] );
	}

	/**
	 * @param array<string, mixed>|string $atts
	 */
	public function render( $atts = [] ): string {
		unset( $atts );

		$sections = SitemapService::instance()->html_tree();
		if ( [] === $sections ) {
			return '';
		}

		$out = '<div class="flexa-aeo-html-sitemap">';
		foreach ( $sections as $section ) {
			$out .= '<section class="flexa-aeo-html-sitemap__group">';
			$out .= '<h2>' . esc_html( $section['label'] ) . '</h2>';
			$out .= '<ul>';
			foreach ( $section['items'] as $item ) {
				$out .= sprintf(
					'<li><a href="%s">%s</a></li>',
					esc_url( $item['url'] ),
					esc_html( $item['title'] )
				);
			}
			$out .= '</ul></section>';
		}
		$out .= '</div>';

		/**
		 * Filters the rendered HTML sitemap markup.
		 *
		 * @param string $out
		 */
		return (string) apply_filters( 'flexa_seo_aeo/sitemap/html_output', $out );
	}
}
