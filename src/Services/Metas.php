<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Services;

use Flexa\SeoAeo\Domain\PostMeta;
use Flexa\SeoAeo\Domain\PostMetaRepository;
use Flexa\SeoAeo\Support\Settings;
use Flexa\SeoAeo\Support\SingletonTrait;
use WP_Post;
use WP_Term;
use WP_User;

defined( 'ABSPATH' ) || exit;

/**
 * Resolves the `<head>` metadata for the current main query into a plain
 * {@see ResolvedMeta}. This class is pure logic — it reads the query, settings,
 * and per-post overrides, substitutes `%%tokens%%`, and returns data. All HTML
 * output and escaping lives in {@see \Flexa\SeoAeo\Actions\Front\Metas}.
 */
final class Metas {
	use SingletonTrait;

	private ?ResolvedMeta $cache = null;

	private PostMetaRepository $repository;

	public function __construct() {
		$this->repository = PostMetaRepository::instance();
	}

	public function resolve(): ResolvedMeta {
		if ( null !== $this->cache ) {
			return $this->cache;
		}

		$meta        = null;
		$context     = [];
		$title_tpl   = '%%sitename%% %%sep%% %%tagline%%';
		$description = '';
		$canonical   = '';
		$og_type     = 'website';
		$og_image    = (string) Settings::get( 'og_default_image' );
		$noindex     = false;
		$nofollow    = false;

		if ( is_front_page() ) {
			$home_title  = (string) Settings::get( 'home_title' );
			$home_desc   = (string) Settings::get( 'home_description' );
			$title_tpl   = '' !== $home_title ? $home_title : '%%sitename%% %%sep%% %%tagline%%';
			$description = '' !== $home_desc ? $home_desc : (string) get_bloginfo( 'description' );
			$canonical   = home_url( '/' );
		} elseif ( is_home() ) {
			$posts_page = get_queried_object();
			$title_tpl  = '%%title%% %%sep%% %%sitename%%';
			if ( $posts_page instanceof WP_Post ) {
				$context['title'] = get_the_title( $posts_page );
				$canonical        = (string) get_permalink( $posts_page );
			}
		} elseif ( is_singular() ) {
			$post = get_queried_object();
			if ( $post instanceof WP_Post ) {
				$meta               = $this->repository->get( $post->ID );
				$noindex            = $meta->noindex;
				$nofollow           = $meta->nofollow;
				$context['title']   = get_the_title( $post );
				$context['excerpt'] = $this->excerpt( $post );
				$title_tpl          = '' !== $meta->title ? $meta->title : '%%title%% %%sep%% %%sitename%%';
				$description        = '' !== $meta->description ? $meta->description : $context['excerpt'];
				$canonical          = '' !== $meta->canonical ? $meta->canonical : (string) get_permalink( $post );
				$og_type            = 'post' === get_post_type( $post ) ? 'article' : 'website';

				if ( '' !== $meta->og_image ) {
					$og_image = $meta->og_image;
				} else {
					$featured = $this->featured_image( $post );
					if ( '' !== $featured ) {
						$og_image = $featured;
					}
				}
			}
		} elseif ( is_category() || is_tag() || is_tax() ) {
			$term = get_queried_object();
			if ( $term instanceof WP_Term ) {
				$context['term_title'] = $term->name;
				$title_tpl             = '%%term_title%% %%sep%% %%sitename%%';
				$description           = wp_strip_all_tags( $term->description );
				$link                  = get_term_link( $term );
				$canonical             = is_string( $link ) ? $link : '';
			}
		} elseif ( is_author() ) {
			$author = get_queried_object();
			if ( $author instanceof WP_User ) {
				$context['author'] = $author->display_name;
				$title_tpl         = '%%author%% %%sep%% %%sitename%%';
				$canonical         = (string) get_author_posts_url( $author->ID );
			}
		} elseif ( is_search() ) {
			$context['searchphrase'] = get_search_query();
			$title_tpl               = '%%searchphrase%% %%sep%% %%sitename%%';
			$noindex                 = true;
		} elseif ( is_404() ) {
			$context['archive_title'] = __( 'Page not found', 'flexa-seo-aeo' );
			$title_tpl                = '%%archive_title%% %%sep%% %%sitename%%';
			$noindex                  = true;
		} elseif ( is_archive() ) {
			$context['archive_title'] = wp_strip_all_tags( get_the_archive_title() );
			$title_tpl                = '%%archive_title%% %%sep%% %%sitename%%';
		}

		/**
		 * Filters the raw title template (still containing `%%tokens%%`) before
		 * substitution, e.g. to make templates configurable per post type.
		 *
		 * @param string                $title_tpl
		 * @param array<string, string> $context
		 */
		$title_tpl = (string) apply_filters( 'flexa_seo_aeo/metas/title_template', $title_tpl, $context );

		$title       = Variables::replace( $title_tpl, $context );
		$description = $this->truncate( Variables::replace( $description, $context ), 160 );
		$canonical   = (string) apply_filters( 'flexa_seo_aeo/metas/canonical', $canonical );

		$resolved = new ResolvedMeta(
			title: $title,
			description: $description,
			canonical: $canonical,
			robots: $this->robots( $noindex, $nofollow, $meta ),
			og: $this->open_graph( $meta, $title, $description, $canonical, $og_type, $og_image ),
			twitter: $this->twitter( $meta, $title, $description, $og_image ),
		);

		/**
		 * Filters the fully-resolved metadata for the current request.
		 *
		 * @param ResolvedMeta $resolved
		 */
		$resolved = apply_filters( 'flexa_seo_aeo/metas/resolved', $resolved );

		$this->cache = $resolved;

		return $resolved;
	}

	/**
	 * @return list<string>
	 */
	private function robots( bool $noindex, bool $nofollow, ?PostMeta $meta ): array {
		$robots = [
			$noindex ? 'noindex' : 'index',
			$nofollow ? 'nofollow' : 'follow',
		];

		// AEO-friendly defaults: let answer engines quote content in full. These
		// only make sense on indexable pages.
		if ( ! $noindex ) {
			$robots[] = 'max-snippet:-1';
			$robots[] = 'max-image-preview:large';
			$robots[] = 'max-video-preview:-1';
		}

		/**
		 * Filters the robots directives for the current request.
		 *
		 * @param list<string>  $robots
		 * @param PostMeta|null $meta
		 */
		$robots = apply_filters( 'flexa_seo_aeo/metas/robots', $robots, $meta );

		return array_values( array_unique( array_map( 'strval', (array) $robots ) ) );
	}

	/**
	 * @return array<string, string>
	 */
	private function open_graph(
		?PostMeta $meta,
		string $title,
		string $description,
		string $canonical,
		string $og_type,
		string $og_image
	): array {
		$og_title = ( $meta && '' !== $meta->og_title ) ? $meta->og_title : $title;
		$og_desc  = ( $meta && '' !== $meta->og_description ) ? $meta->og_description : $description;

		$og = [
			'og:type'        => $og_type,
			'og:title'       => $og_title,
			'og:description' => $og_desc,
			'og:url'         => '' !== $canonical ? $canonical : $this->current_url(),
			'og:site_name'   => (string) get_bloginfo( 'name' ),
			'og:locale'      => str_replace( '-', '_', (string) get_bloginfo( 'language' ) ),
		];

		if ( '' !== $og_image ) {
			$og['og:image'] = $og_image;
		}

		return array_filter( $og, static fn( string $v ): bool => '' !== $v );
	}

	/**
	 * @return array<string, string>
	 */
	private function twitter( ?PostMeta $meta, string $title, string $description, string $og_image ): array {
		$tw_title = ( $meta && '' !== $meta->twitter_title ) ? $meta->twitter_title : $title;
		$tw_desc  = ( $meta && '' !== $meta->twitter_description ) ? $meta->twitter_description : $description;
		$tw_image = ( $meta && '' !== $meta->twitter_image ) ? $meta->twitter_image : $og_image;

		$twitter = [
			'twitter:card'        => (string) Settings::get( 'twitter_card_type' ),
			'twitter:title'       => $tw_title,
			'twitter:description' => $tw_desc,
		];

		if ( '' !== $tw_image ) {
			$twitter['twitter:image'] = $tw_image;
		}

		return array_filter( $twitter, static fn( string $v ): bool => '' !== $v );
	}

	private function excerpt( WP_Post $post ): string {
		$raw = has_excerpt( $post ) ? $post->post_excerpt : $post->post_content;
		$raw = wp_strip_all_tags( strip_shortcodes( $raw ) );
		$raw = (string) preg_replace( '/\s+/', ' ', $raw );

		return $this->truncate( trim( $raw ), 160 );
	}

	private function featured_image( WP_Post $post ): string {
		$thumb_id = get_post_thumbnail_id( $post );
		if ( ! $thumb_id ) {
			return '';
		}

		$url = wp_get_attachment_image_url( (int) $thumb_id, 'full' );

		return is_string( $url ) ? $url : '';
	}

	private function truncate( string $text, int $limit ): string {
		if ( mb_strlen( $text ) <= $limit ) {
			return $text;
		}

		$cut   = mb_substr( $text, 0, $limit );
		$space = mb_strrpos( $cut, ' ' );
		if ( false !== $space && $space > 0 ) {
			$cut = mb_substr( $cut, 0, $space );
		}

		return rtrim( $cut ) . '…';
	}

	private function current_url(): string {
		$wp      = $GLOBALS['wp'] ?? null;
		$request = $wp instanceof \WP ? (string) $wp->request : '';

		return home_url( '' !== $request ? '/' . ltrim( $request, '/' ) : '/' );
	}
}
