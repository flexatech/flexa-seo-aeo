<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Actions\Front;

use Flexa\SeoAeo\Services\Metas as MetasService;
use Flexa\SeoAeo\Services\ResolvedMeta;
use Flexa\SeoAeo\Support\Settings;
use Flexa\SeoAeo\Support\SingletonTrait;

defined( 'ABSPATH' ) || exit;

/**
 * Frontend I/O layer: takes the {@see ResolvedMeta} computed by the service and
 * prints the `<title>` (via the document-title filter) plus the `<head>` meta,
 * canonical, robots, Open Graph and Twitter/X Card tags — each gated by its
 * module toggle. This class does the escaping; the service never emits HTML.
 */
final class Metas {
	use SingletonTrait;

	private ?ResolvedMeta $resolved = null;

	public function register(): void {
		if ( is_admin() ) {
			return;
		}

		add_filter( 'pre_get_document_title', [ $this, 'filter_document_title' ], 20 );
		add_action( 'wp_head', [ $this, 'print_head' ], 1 );
	}

	public function filter_document_title( string $title ): string {
		if ( ! (bool) Settings::get( 'titles_metas' ) ) {
			return $title;
		}

		$resolved = $this->meta()->title;

		return '' !== $resolved ? $resolved : $title;
	}

	public function print_head(): void {
		$meta = $this->meta();

		echo "\n<!-- Flexa AEO -->\n";

		if ( (bool) Settings::get( 'titles_metas' ) ) {
			if ( '' !== $meta->description ) {
				$this->meta_tag( 'name', 'description', $meta->description );
			}

			$robots = $meta->robots_line();
			if ( '' !== $robots ) {
				$this->meta_tag( 'name', 'robots', $robots );
			}

			if ( '' !== $meta->canonical ) {
				printf( "<link rel=\"canonical\" href=\"%s\" />\n", esc_url( $meta->canonical ) );
			}
		}

		if ( (bool) Settings::get( 'open_graph' ) ) {
			/**
			 * Filters the Open Graph property => content map before output.
			 * Integrations (e.g. WooCommerce) use this to override `og:type` and
			 * append `product:*` tags for rich commerce previews in social and
			 * chat apps.
			 *
			 * @param array<string, string> $og
			 */
			$og = (array) apply_filters( 'flexa_seo_aeo/front/og', $meta->og );
			foreach ( $og as $property => $content ) {
				if ( ! is_scalar( $content ) || '' === (string) $content ) {
					continue;
				}
				printf(
					"<meta property=\"%s\" content=\"%s\" />\n",
					esc_attr( (string) $property ),
					esc_attr( (string) $content )
				);
			}
		}

		if ( (bool) Settings::get( 'twitter_cards' ) ) {
			foreach ( $meta->twitter as $name => $content ) {
				$this->meta_tag( 'name', $name, $content );
			}
		}

		echo "<!-- /Flexa AEO -->\n";
	}

	private function meta_tag( string $attr, string $key, string $content ): void {
		printf(
			"<meta %s=\"%s\" content=\"%s\" />\n",
			esc_attr( $attr ),
			esc_attr( $key ),
			esc_attr( $content )
		);
	}

	private function meta(): ResolvedMeta {
		if ( null === $this->resolved ) {
			$this->resolved = MetasService::instance()->resolve();
		}

		return $this->resolved;
	}
}
