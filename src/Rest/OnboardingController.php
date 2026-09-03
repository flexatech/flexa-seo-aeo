<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Rest;

use Flexa\SeoAeo\Services\Aeo\Readiness;
use Flexa\SeoAeo\Services\Onboarding\Detector;
use Flexa\SeoAeo\Services\Onboarding\Recommended;
use Flexa\SeoAeo\Support\OnboardingState;
use WP_Post;
use WP_Query;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * GET  /wp-json/flexa-seo-aeo/v1/onboarding      — state + detection + recommendations.
 * POST /wp-json/flexa-seo-aeo/v1/onboarding      — persist a partial state update.
 * GET  /wp-json/flexa-seo-aeo/v1/onboarding/scan — a batched readiness sample.
 *
 * All three are gated on the settings capability (`manage_options`): the wizard
 * proposes global configuration, so an editor must never see it. Detection and
 * recommendations live in dedicated services; the scan reuses {@see Readiness}
 * over a tiny, date-ordered window with no meta_query at all.
 */
final class OnboardingController extends BaseRestController {
	/** Content-scan window: how many posts a full wizard scan ever covers. */
	private const SCAN_LIMIT = 12;

	/** Hard ceiling on the scan window, even via the filter. */
	private const SCAN_MAX = 20;

	/** Per-request batch bounds for the incremental scan. */
	private const BATCH_DEFAULT = 4;
	private const BATCH_MAX     = 10;

	public function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/onboarding',
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_state' ],
					'permission_callback' => [ $this, 'settings_permission' ],
				],
				[
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'update_state' ],
					'permission_callback' => [ $this, 'settings_permission' ],
				],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/onboarding/scan',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'scan' ],
				'permission_callback' => [ $this, 'settings_permission' ],
				'args'                => [
					'offset' => [
						'type'    => 'integer',
						'default' => 0,
					],
					'batch'  => [
						'type'    => 'integer',
						'default' => 0,
					],
				],
			]
		);
	}

	/**
	 * State plus the freshly-computed detection and recommendations. The wizard
	 * boots on this single round-trip.
	 */
	public function get_state( WP_REST_Request $request ): WP_REST_Response {
		unset( $request );

		$detect = Detector::instance()->detect();

		return new WP_REST_Response(
			[
				'state'       => OnboardingState::all(),
				'detect'      => $detect,
				'recommended' => Recommended::instance()->all( $detect ),
			]
		);
	}

	/**
	 * Persist a partial state update (status / current_step / completed_steps /
	 * applied) and echo the full coerced state back.
	 */
	public function update_state( WP_REST_Request $request ): WP_REST_Response {
		// get_json_params() returns null on an empty/invalid body; the cast
		// normalises that to an empty array.
		$incoming = (array) $request->get_json_params();

		return new WP_REST_Response( [ 'state' => OnboardingState::update( $incoming ) ] );
	}

	/**
	 * Score one batch of the most-recently-modified posts. Read-only: it never
	 * touches the dashboard transient or the trend log, so an abandoned wizard run
	 * leaves no trace. The UI loops with the returned offset until `done`.
	 *
	 * @return WP_REST_Response
	 */
	public function scan( WP_REST_Request $request ): WP_REST_Response {
		$offset = max( 0, (int) $request->get_param( 'offset' ) );
		$batch  = (int) $request->get_param( 'batch' );
		$batch  = $batch > 0 ? min( $batch, self::BATCH_MAX ) : self::BATCH_DEFAULT;

		$total     = $this->scan_total();
		$remaining = max( 0, $total - $offset );
		$take      = min( $batch, $remaining );

		$items = $take > 0 ? $this->scan_batch( $offset, $take ) : [];
		$next  = $offset + count( $items );
		$done  = [] === $items || $next >= $total;

		return new WP_REST_Response(
			[
				'total'  => $total,
				'offset' => $offset,
				'batch'  => $batch,
				'done'   => $done,
				'items'  => $items,
			]
		);
	}

	/**
	 * The capped size of the scan window: the smaller of the published post/page
	 * count and the (filterable, hard-capped) limit.
	 */
	private function scan_total(): int {
		$published = $this->published_count( 'post' ) + $this->published_count( 'page' );

		return min( $this->scan_limit(), $published );
	}

	private function published_count( string $type ): int {
		$counts = wp_count_posts( $type );

		return (int) ( $counts->publish ?? 0 );
	}

	private function scan_limit(): int {
		/**
		 * Filters how many posts the onboarding content scan covers in total.
		 * Kept tiny so the wizard stays snappy; hard-capped regardless.
		 *
		 * @param int $limit
		 */
		$limit = (int) apply_filters( 'flexa_seo_aeo/onboarding/scan_limit', self::SCAN_LIMIT );

		return max( 1, min( self::SCAN_MAX, $limit ) );
	}

	/**
	 * Score one bounded batch. A single date-ordered `WP_Query` (no meta_query of
	 * any kind), then {@see Readiness} per post.
	 *
	 * @return list<array{id: int, title: string, url: string, score: int, grade: string, worst_check: string}>
	 */
	private function scan_batch( int $offset, int $take ): array {
		$query = new WP_Query(
			[
				'post_type'              => [ 'post', 'page' ],
				'post_status'            => 'publish',
				'posts_per_page'         => $take,
				'offset'                 => $offset,
				'orderby'                => 'modified',
				'order'                  => 'DESC',
				'fields'                 => 'ids',
				'ignore_sticky_posts'    => true,
				'no_found_rows'          => true,
				'update_post_term_cache' => false,
			]
		);

		$readiness = Readiness::instance();
		$items     = [];

		foreach ( $query->posts as $id ) {
			$post = get_post( (int) $id );
			if ( ! $post instanceof WP_Post ) {
				continue;
			}

			$report  = $readiness->report( $post );
			$items[] = [
				'id'          => (int) $post->ID,
				'title'       => (string) get_the_title( $post ),
				'url'         => (string) get_permalink( $post ),
				'score'       => (int) $report['score'],
				'grade'       => (string) $report['grade'],
				'worst_check' => $this->worst_check( $report['checks'] ),
			];
		}

		return $items;
	}

	/**
	 * The label of the most severe non-passing check (fail before warn), or an
	 * empty string when every check passes.
	 *
	 * @param list<array{id: string, label: string, status: string, weight: int, hint: string, fix: array{label: string, scope: string, patch: array<string, mixed>}|null}> $checks
	 */
	private function worst_check( array $checks ): string {
		$failing = array_values(
			array_filter( $checks, static fn( array $check ): bool => 'pass' !== $check['status'] )
		);
		if ( [] === $failing ) {
			return '';
		}

		usort(
			$failing,
			fn( array $a, array $b ): int => $this->severity_rank( $a['status'] ) <=> $this->severity_rank( $b['status'] )
		);

		return (string) $failing[0]['label'];
	}

	private function severity_rank( string $status ): int {
		return match ( $status ) {
			'fail'  => 0,
			'warn'  => 1,
			default => 2,
		};
	}
}
