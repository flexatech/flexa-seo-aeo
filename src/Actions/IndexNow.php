<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Actions;

use Flexa\SeoAeo\Services\IndexNow as IndexNowService;
use Flexa\SeoAeo\Services\Sitemap as SitemapService;
use Flexa\SeoAeo\Support\Settings;
use Flexa\SeoAeo\Support\SingletonTrait;
use WP_Post;

defined( 'ABSPATH' ) || exit;

/**
 * Wires IndexNow into WordPress: pings the API when a sitemap-eligible post is
 * published or updated, serves the verification key file at `/{key}.txt` via a
 * rewrite, and flushes rewrites when the feature is switched on so the key file
 * resolves immediately.
 */
final class IndexNow {
	use SingletonTrait;

	private const KEY_QUERY_VAR = 'flexa_indexnow_key';

	public function register(): void {
		// Attached unconditionally so enabling IndexNow for the first time still
		// flushes rewrites and the key file resolves right away.
		add_action( 'flexa_seo_aeo/settings/updated', [ $this, 'maybe_flush' ], 10, 2 );

		if ( ! (bool) Settings::get( 'indexnow' ) ) {
			return;
		}

		add_action( 'init', [ $this, 'add_rewrite_rule' ] );
		add_filter( 'query_vars', [ $this, 'register_query_var' ] );
		add_action( 'template_redirect', [ $this, 'serve_key' ], 0 );
		add_action( 'transition_post_status', [ $this, 'on_transition' ], 10, 3 );
	}

	public function add_rewrite_rule(): void {
		$key = IndexNowService::instance()->key();
		if ( '' === $key ) {
			return;
		}

		// The key is alphanumeric (wp_generate_password without special chars),
		// so it is safe to drop straight into the rewrite pattern.
		add_rewrite_rule( '^' . $key . '\.txt$', 'index.php?' . self::KEY_QUERY_VAR . '=1', 'top' );
	}

	/**
	 * @param array<int, string> $vars
	 * @return array<int, string>
	 */
	public function register_query_var( array $vars ): array {
		$vars[] = self::KEY_QUERY_VAR;

		return $vars;
	}

	public function serve_key(): void {
		if ( '' === (string) get_query_var( self::KEY_QUERY_VAR ) ) {
			return;
		}

		$key = IndexNowService::instance()->stored_key();
		if ( ! headers_sent() ) {
			header( 'Content-Type: text/plain; charset=UTF-8' );
		}

		if ( '' === $key ) {
			status_header( 404 );
			exit;
		}

		echo esc_html( $key );
		exit;
	}

	public function on_transition( string $new_status, string $old_status, WP_Post $post ): void {
		unset( $old_status );

		if ( 'publish' !== $new_status ) {
			return;
		}
		if ( wp_is_post_revision( $post ) || wp_is_post_autosave( $post ) ) {
			return;
		}
		if ( ! in_array( $post->post_type, SitemapService::instance()->post_types(), true ) ) {
			return;
		}

		$url = get_permalink( $post );
		if ( ! is_string( $url ) || '' === $url ) {
			return;
		}

		IndexNowService::instance()->submit( [ $url ] );
	}

	/**
	 * When settings are saved with IndexNow enabled, refresh rewrites so the
	 * newly-minted key file starts resolving without a manual permalink re-save.
	 *
	 * @param array<string, mixed> $new_settings
	 * @param array<string, mixed> $old_settings
	 */
	public function maybe_flush( array $new_settings, array $old_settings ): void {
		$now = ! empty( $new_settings['indexnow'] );
		$was = ! empty( $old_settings['indexnow'] );
		if ( $now === $was ) {
			return;
		}

		if ( $now ) {
			$this->add_rewrite_rule();
		}
		flush_rewrite_rules( false );
	}
}
