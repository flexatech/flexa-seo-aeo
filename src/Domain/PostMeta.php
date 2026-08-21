<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Domain;

defined( 'ABSPATH' ) || exit;

/**
 * Per-post SEO overrides. A plain value object: every field is optional and an
 * empty string / false means "fall back to the computed default" (handled in
 * {@see \Flexa\SeoAeo\Services\Metas}). The `META_KEYS` map is the single source
 * of truth for the underlying post-meta storage keys.
 */
final class PostMeta {
	/**
	 * Field name (JS/REST-facing) => underscore-prefixed post_meta key.
	 *
	 * @var array<string, string>
	 */
	public const META_KEYS = [
		'title'               => '_flexa_seo_aeo_title',
		'description'         => '_flexa_seo_aeo_description',
		'canonical'           => '_flexa_seo_aeo_canonical',
		'noindex'             => '_flexa_seo_aeo_noindex',
		'nofollow'            => '_flexa_seo_aeo_nofollow',
		'og_title'            => '_flexa_seo_aeo_og_title',
		'og_description'      => '_flexa_seo_aeo_og_description',
		'og_image'            => '_flexa_seo_aeo_og_image',
		'twitter_title'       => '_flexa_seo_aeo_twitter_title',
		'twitter_description' => '_flexa_seo_aeo_twitter_description',
		'twitter_image'       => '_flexa_seo_aeo_twitter_image',
	];

	public function __construct(
		public readonly string $title = '',
		public readonly string $description = '',
		public readonly string $canonical = '',
		public readonly bool $noindex = false,
		public readonly bool $nofollow = false,
		public readonly string $og_title = '',
		public readonly string $og_description = '',
		public readonly string $og_image = '',
		public readonly string $twitter_title = '',
		public readonly string $twitter_description = '',
		public readonly string $twitter_image = '',
	) {
	}

	/**
	 * Build from a raw associative array (REST payload or per-key meta reads).
	 * Unknown keys are ignored; missing keys take the constructor default.
	 *
	 * @param array<string, mixed> $data
	 */
	public static function from_array( array $data ): self {
		$str = static fn( string $key ): string => isset( $data[ $key ] ) && is_scalar( $data[ $key ] )
			? (string) $data[ $key ]
			: '';

		$bool = static fn( string $key ): bool => ! empty( $data[ $key ] )
			&& ! in_array( $data[ $key ], [ '0', 'false', 'off', 'no' ], true );

		return new self(
			title: $str( 'title' ),
			description: $str( 'description' ),
			canonical: $str( 'canonical' ),
			noindex: $bool( 'noindex' ),
			nofollow: $bool( 'nofollow' ),
			og_title: $str( 'og_title' ),
			og_description: $str( 'og_description' ),
			og_image: $str( 'og_image' ),
			twitter_title: $str( 'twitter_title' ),
			twitter_description: $str( 'twitter_description' ),
			twitter_image: $str( 'twitter_image' ),
		);
	}

	/**
	 * JS/REST-friendly shape. Fires an extension hook so Pro (or a migration
	 * add-on) can inject additional fields without touching the free VO.
	 *
	 * @return array<string, bool|string>
	 */
	public function to_array(): array {
		$data = [
			'title'               => $this->title,
			'description'         => $this->description,
			'canonical'           => $this->canonical,
			'noindex'             => $this->noindex,
			'nofollow'            => $this->nofollow,
			'og_title'            => $this->og_title,
			'og_description'      => $this->og_description,
			'og_image'            => $this->og_image,
			'twitter_title'       => $this->twitter_title,
			'twitter_description' => $this->twitter_description,
			'twitter_image'       => $this->twitter_image,
		];

		/**
		 * Filters the array form of a post's SEO meta.
		 *
		 * @param array<string, bool|string> $data
		 * @param PostMeta                    $meta
		 */
		return apply_filters( 'flexa_seo_aeo/post_meta/to_array', $data, $this );
	}
}
