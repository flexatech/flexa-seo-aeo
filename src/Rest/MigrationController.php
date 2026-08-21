<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Rest;

use Flexa\SeoAeo\Services\Migration\LegacyMapper;
use Flexa\SeoAeo\Services\Migration\Migrator;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * GET  /wp-json/flexa-seo-aeo/v1/migrate/sources — detected source plugins.
 * POST /wp-json/flexa-seo-aeo/v1/migrate          — run one migration batch.
 *
 * A batch is intentionally small; the admin app calls this repeatedly with the
 * returned `next_offset` until `done` is true, rendering a progress bar. The
 * heavy lifting lives in {@see Migrator}; this controller only guards and
 * unpacks the request.
 */
final class MigrationController extends BaseRestController {
	public function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/migrate/sources',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'get_sources' ],
				'permission_callback' => [ $this, 'settings_permission' ],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/migrate',
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'run' ],
				'permission_callback' => [ $this, 'settings_permission' ],
				'args'                => [
					'source'    => [
						'required'          => true,
						'type'              => 'string',
						'validate_callback' => static fn( $value ): bool => is_string( $value ) && LegacyMapper::is_source( $value ),
					],
					'overwrite' => [
						'type'    => 'boolean',
						'default' => false,
					],
					'offset'    => [
						'type'    => 'integer',
						'default' => 0,
					],
					'batch'     => [
						'type'    => 'integer',
						'default' => 0,
					],
				],
			]
		);
	}

	public function get_sources( WP_REST_Request $request ): WP_REST_Response {
		unset( $request );

		return new WP_REST_Response( [ 'sources' => Migrator::instance()->sources() ] );
	}

	public function run( WP_REST_Request $request ): WP_REST_Response {
		$source    = (string) $request->get_param( 'source' );
		$overwrite = (bool) $request->get_param( 'overwrite' );
		$offset    = (int) $request->get_param( 'offset' );
		$batch     = (int) $request->get_param( 'batch' );

		$result = Migrator::instance()->migrate( $source, $overwrite, $offset, $batch );

		return new WP_REST_Response( $result );
	}
}
