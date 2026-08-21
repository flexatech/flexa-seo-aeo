<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Services;

use Flexa\SeoAeo\Support\Settings;
use Flexa\SeoAeo\Support\SingletonTrait;

defined( 'ABSPATH' ) || exit;

/**
 * IndexNow client: manages the per-site key and submits changed URLs so
 * participating engines (Bing, Yandex, Seznam, Naver — and, increasingly, the
 * crawlers behind AI answer engines) re-crawl within minutes instead of days.
 * Google's Indexing API needs OAuth service-account auth and is deferred to Pro.
 */
final class IndexNow {
	use SingletonTrait;

	private const ENDPOINT = 'https://api.indexnow.org/indexnow';

	/**
	 * The stored key, or '' if one has never been generated.
	 */
	public function stored_key(): string {
		return (string) Settings::get( 'indexnow_key' );
	}

	/**
	 * The key, generating + persisting one on first use.
	 */
	public function key(): string {
		$key = $this->stored_key();
		if ( '' === $key ) {
			$key = wp_generate_password( 32, false );
			$this->persist_key( $key );
		}

		return $key;
	}

	/**
	 * URL where the key file is served (the rewrite in the IndexNow action).
	 */
	public function key_url(): string {
		return home_url( '/' . $this->key() . '.txt' );
	}

	/**
	 * Submit one or more URLs to IndexNow. Fire-and-forget (non-blocking) so a
	 * slow endpoint never delays the editor save.
	 *
	 * @param list<string> $urls
	 */
	public function submit( array $urls ): void {
		$urls = array_values( array_unique( array_filter( array_map( 'strval', $urls ) ) ) );
		if ( [] === $urls ) {
			return;
		}

		$host = wp_parse_url( home_url(), PHP_URL_HOST );
		if ( ! is_string( $host ) || '' === $host ) {
			return;
		}

		$body = wp_json_encode(
			[
				'host'        => $host,
				'key'         => $this->key(),
				'keyLocation' => $this->key_url(),
				'urlList'     => $urls,
			]
		);
		if ( ! is_string( $body ) ) {
			return;
		}

		$endpoint = (string) apply_filters( 'flexa_seo_aeo/indexnow/endpoint', self::ENDPOINT );

		wp_remote_post(
			$endpoint,
			[
				'headers'  => [ 'Content-Type' => 'application/json; charset=utf-8' ],
				'body'     => $body,
				'timeout'  => 5,
				'blocking' => false,
			]
		);

		/**
		 * Fires after URLs are handed to IndexNow.
		 *
		 * @param list<string> $urls
		 * @param string       $host
		 */
		do_action( 'flexa_seo_aeo/indexnow/submitted', $urls, $host );
	}

	private function persist_key( string $key ): void {
		$all                 = Settings::all();
		$all['indexnow_key'] = $key;
		update_option( Settings::OPTION_KEY, $all );
	}
}
