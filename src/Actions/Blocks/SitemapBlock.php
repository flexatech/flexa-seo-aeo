<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Actions\Blocks;

use Flexa\SeoAeo\Actions\Sitemap\HtmlSitemap;
use Flexa\SeoAeo\Support\Settings;
use Flexa\SeoAeo\Support\SingletonTrait;

defined( 'ABSPATH' ) || exit;

/**
 * Registers the `flexa-seo-aeo/sitemap` dynamic block. It's the Gutenberg
 * wrapper around the same HTML sitemap as the `[flexa_sitemap]` shortcode —
 * both call {@see HtmlSitemap::render()}, so the block, shortcode, and XML
 * sitemap can never drift. Gated by the `html_sitemap` toggle, same as the
 * shortcode.
 */
final class SitemapBlock {
	use SingletonTrait;

	private const HANDLE = 'flexa-seo-aeo-sitemap-block';

	public function register(): void {
		if ( ! (bool) Settings::get( 'html_sitemap' ) ) {
			return;
		}

		add_action( 'init', [ $this, 'register_block' ] );
	}

	public function register_block(): void {
		// The block.json references this handle as its editorScript; register it
		// first so register_block_type() can wire it into the editor.
		wp_register_script(
			self::HANDLE,
			FLEXA_SEO_AEO_URL . 'blocks/sitemap/index.js',
			[ 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-server-side-render', 'wp-i18n' ],
			FLEXA_SEO_AEO_VERSION,
			true
		);

		if ( function_exists( 'wp_set_script_translations' ) ) {
			wp_set_script_translations(
				self::HANDLE,
				FLEXA_SEO_AEO_TEXT_DOMAIN,
				FLEXA_SEO_AEO_PATH . 'i18n/languages'
			);
		}

		register_block_type(
			FLEXA_SEO_AEO_PATH . 'blocks/sitemap',
			[ 'render_callback' => [ $this, 'render' ] ]
		);
	}

	/**
	 * Server render for the block. Signature matches the render_callback
	 * contract ($attributes, $content); both are ignored — the sitemap has no
	 * per-instance options.
	 *
	 * @param array<string, mixed> $attributes
	 */
	public function render( array $attributes = [], string $content = '' ): string {
		unset( $attributes, $content );

		return HtmlSitemap::instance()->render();
	}
}
