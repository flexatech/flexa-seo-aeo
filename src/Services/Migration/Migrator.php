<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Services\Migration;

use Flexa\SeoAeo\Domain\PostMeta;
use Flexa\SeoAeo\Domain\PostMetaRepository;
use Flexa\SeoAeo\Support\SingletonTrait;
use WP_Query;

defined( 'ABSPATH' ) || exit;

/**
 * Bulk-imports per-post SEO meta from another plugin (Yoast SEO, Rank Math)
 * into Flexa's `_flexa_seo_aeo_*` keys. This is the write-side counterpart to
 * the read fallback in {@see PostMetaRepository}: the fallback keeps output
 * working while both plugins coexist; this copies the data across so the site
 * can deactivate the old plugin.
 *
 * Work is done in offset-paged batches (the REST/UI loop calls one batch at a
 * time) so a large site never trips a request timeout. Because each batch reads
 * the *legacy* keys and writes *Flexa* keys, the detection query is stable
 * across batches — the found-post count does not shift as we migrate.
 */
final class Migrator {
	use SingletonTrait;

	private const MAX_BATCH     = 100;
	private const DEFAULT_BATCH = 50;

	/**
	 * Availability + counts for every supported source, for the UI to render.
	 *
	 * @return list<array{id: string, label: string, count: int, available: bool}>
	 */
	public function sources(): array {
		$out = [];
		foreach ( LegacyMapper::source_ids() as $source ) {
			$count = $this->count( $source );
			$out[] = [
				'id'        => $source,
				'label'     => LegacyMapper::label( $source ),
				'count'     => $count,
				'available' => $count > 0,
			];
		}

		return $out;
	}

	/**
	 * Migrate one batch of posts from a source.
	 *
	 * @return array{source: string, total: int, processed: int, migrated: int, skipped: int, next_offset: int, done: bool}
	 */
	public function migrate( string $source, bool $overwrite, int $offset, int $batch ): array {
		$offset = max( 0, $offset );
		$batch  = $batch > 0 ? min( $batch, self::MAX_BATCH ) : self::DEFAULT_BATCH;

		$result = [
			'source'      => $source,
			'total'       => 0,
			'processed'   => 0,
			'migrated'    => 0,
			'skipped'     => 0,
			'next_offset' => $offset,
			'done'        => true,
		];

		if ( ! LegacyMapper::is_source( $source ) ) {
			return $result;
		}

		$query = new WP_Query(
			$this->query_args(
				$source,
				[
					'fields'         => 'ids',
					'posts_per_page' => $batch,
					'offset'         => $offset,
					'orderby'        => 'ID',
					'order'          => 'ASC',
					'no_found_rows'  => false,
				]
			)
		);

		$ids   = array_map( 'intval', $query->posts );
		$total = (int) $query->found_posts;
		$keys  = LegacyMapper::legacy_keys( $source );
		$repo  = PostMetaRepository::instance();

		$migrated = 0;
		$skipped  = 0;

		foreach ( $ids as $post_id ) {
			$raw = [];
			foreach ( $keys as $legacy_key ) {
				$raw[ $legacy_key ] = get_post_meta( $post_id, $legacy_key, true );
			}

			$mapped = LegacyMapper::map( $source, $raw );
			if ( [] === $mapped ) {
				++$skipped;
				continue;
			}

			$payload = $overwrite ? $mapped : $this->only_missing( $post_id, $mapped );
			if ( [] === $payload ) {
				++$skipped;
				continue;
			}

			$repo->save( $post_id, $payload );
			++$migrated;
		}

		$processed = count( $ids );
		$next      = $offset + $processed;
		$done      = 0 === $processed || $next >= $total;

		$result = [
			'source'      => $source,
			'total'       => $total,
			'processed'   => $processed,
			'migrated'    => $migrated,
			'skipped'     => $skipped,
			'next_offset' => $next,
			'done'        => $done,
		];

		/**
		 * Fires after each migration batch completes.
		 *
		 * @param string                                                                                              $source
		 * @param array{source: string, total: int, processed: int, migrated: int, skipped: int, next_offset: int, done: bool} $result
		 */
		do_action( 'flexa_seo_aeo/migration/batch', $source, $result );

		return $result;
	}

	/**
	 * Drop fields the post already has a Flexa value for, so a non-overwrite
	 * run never clobbers manual edits.
	 *
	 * @param array<string, string|bool> $mapped
	 * @return array<string, string|bool>
	 */
	private function only_missing( int $post_id, array $mapped ): array {
		$out = [];
		foreach ( $mapped as $field => $value ) {
			$meta_key = PostMeta::META_KEYS[ $field ] ?? null;
			if ( null === $meta_key ) {
				continue;
			}

			$existing = get_post_meta( $post_id, $meta_key, true );
			if ( '' === $existing || null === $existing || false === $existing ) {
				$out[ $field ] = $value;
			}
		}

		return $out;
	}

	private function count( string $source ): int {
		$query = new WP_Query(
			$this->query_args(
				$source,
				[
					'fields'         => 'ids',
					'posts_per_page' => 1,
					'no_found_rows'  => false,
				]
			)
		);

		return (int) $query->found_posts;
	}

	/**
	 * Build WP_Query args that match every post carrying data from the source.
	 *
	 * @param array<string, mixed> $extra
	 * @return array<string, mixed>
	 */
	private function query_args( string $source, array $extra ): array {
		$meta_query = [ 'relation' => 'OR' ];
		foreach ( LegacyMapper::sentinel_keys( $source ) as $key ) {
			$meta_query[] = [
				'key'     => $key,
				'compare' => 'EXISTS',
			];
		}

		$base = [
			'post_type'           => $this->post_types(),
			'post_status'         => 'any',
			'ignore_sticky_posts' => true,
			'suppress_filters'    => true,
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- One-shot admin migration; the EXISTS scan is intentional and batched.
			'meta_query'          => $meta_query,
		];

		return array_merge( $base, $extra );
	}

	/**
	 * Public post types are where SEO meta lives.
	 *
	 * @return list<string>
	 */
	private function post_types(): array {
		$types = get_post_types( [ 'public' => true ], 'names' );
		unset( $types['attachment'] );

		return array_values( $types );
	}
}
