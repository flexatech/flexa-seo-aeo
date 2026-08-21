<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Services;

defined( 'ABSPATH' ) || exit;

/**
 * The fully-resolved `<head>` metadata for the current request. Pure data:
 * {@see Metas} builds it (all tokens already substituted, all values plain
 * text / URLs) and {@see \Flexa\SeoAeo\Actions\Front\Metas} escapes and prints
 * it. Keeping resolution and output apart makes the values unit-testable
 * without a request in flight.
 */
final class ResolvedMeta {
	/**
	 * @param list<string>          $robots  robots directives, e.g. ['index','follow']
	 * @param array<string, string> $og      property => content for Open Graph tags
	 * @param array<string, string> $twitter name => content for Twitter/X Card tags
	 */
	public function __construct(
		public readonly string $title,
		public readonly string $description,
		public readonly string $canonical,
		public readonly array $robots,
		public readonly array $og,
		public readonly array $twitter,
	) {
	}

	public function robots_line(): string {
		return implode( ', ', $this->robots );
	}
}
