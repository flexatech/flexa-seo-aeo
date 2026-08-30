<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Actions;

use Flexa\SeoAeo\Services\Sitemap as SitemapService;
use Flexa\SeoAeo\Support\Settings;
use Flexa\SeoAeo\Support\SingletonTrait;

defined( 'ABSPATH' ) || exit;

/**
 * Augments WordPress's virtual robots.txt: advertises the XML sitemap so
 * crawlers (and AI answer engines) discover it, and appends any custom rules the
 * site owner entered. Only affects the virtual file — a physical robots.txt in
 * the web root still wins, exactly as core behaves.
 */
final class RobotsTxt {
	use SingletonTrait;

	public function register(): void {
		add_filter( 'robots_txt', [ $this, 'filter' ], 10, 2 );
	}

	public function filter( string $output, bool $is_public ): string {
		// Don't advertise anything on a discouraged (non-public) site.
		if ( ! $is_public ) {
			return $output;
		}

		$lines = [ rtrim( $output ) ];

		if ( (bool) Settings::get( 'xml_sitemap' ) ) {
			$sitemap = SitemapService::instance()->index_url();
			if ( '' !== $sitemap && ! str_contains( $output, $sitemap ) ) {
				$lines[] = 'Sitemap: ' . $sitemap;
			}
		}

		// Append the site owner's custom robots.txt rules — the same "extra
		// robots rules" field every SEO plugin ships (Yoast, Rank Math, AIOSEO).
		// This is NOT arbitrary code insertion: the value is plain-text crawler
		// directives (User-agent / Disallow / Allow / Sitemap), sanitized with
		// sanitize_textarea_field() on save (see Settings::sanitize()), and
		// emitted by WordPress core through the `robots_txt` filter as a
		// text/plain document — it is never parsed as HTML/CSS/JS/PHP and cannot
		// execute. No markup context exists here, so there is nothing to escape.
		$extra = trim( (string) Settings::get( 'robots_txt' ) );
		if ( '' !== $extra ) {
			$lines[] = '';
			$lines[] = $extra;
		}

		return implode( "\n", $lines ) . "\n";
	}
}
