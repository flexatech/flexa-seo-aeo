<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Actions\Front;

use Flexa\SeoAeo\Services\Aeo\Schema as SchemaService;
use Flexa\SeoAeo\Support\Settings;
use Flexa\SeoAeo\Support\SingletonTrait;

defined( 'ABSPATH' ) || exit;

/**
 * Frontend I/O for the AEO JSON-LD: prints the `@graph` computed by
 * {@see SchemaService} inside a single `application/ld+json` script in the
 * `<head>`. The service produces the data; this class encodes and outputs it.
 */
final class Schema {
	use SingletonTrait;

	public function register(): void {
		if ( is_admin() ) {
			return;
		}

		add_action( 'wp_head', [ $this, 'print_schema' ], 10 );
	}

	public function print_schema(): void {
		if ( ! (bool) Settings::get_aeo( 'schema' ) ) {
			return;
		}

		$graph = SchemaService::instance()->graph();
		if ( [] === $graph ) {
			return;
		}

		// JSON_HEX_TAG | JSON_HEX_AMP escape `<`, `>` and `&` to `\uXXXX` sequences:
		// still valid JSON that decodes to the original string, but `</script>` can
		// never form, so the payload is safe to drop straight into the element.
		$json = wp_json_encode( $graph, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP );
		if ( ! is_string( $json ) ) {
			return;
		}

		// This is a Schema.org structured-data block: JSON-LD MUST be emitted
		// inline as <script type="application/ld+json"> and cannot be enqueued.
		// The payload is JSON encoded with JSON_HEX_TAG|JSON_HEX_AMP (see above),
		// so `</script>` can never form.
		printf(
			"<script type=\"application/ld+json\">%s</script>\n",
			$json // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		);
	}
}
