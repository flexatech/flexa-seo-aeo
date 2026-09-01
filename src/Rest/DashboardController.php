<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Rest;

use Flexa\SeoAeo\Services\Aeo\SiteAudit;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * GET  /wp-json/flexa-seo-aeo/v1/dashboard      — the cached site health report.
 * POST /wp-json/flexa-seo-aeo/v1/dashboard/scan — force a fresh scan + snapshot.
 *
 * Both are gated on the plugin's manage capability (`edit_posts`) since the
 * report only summarises content the user can already see. The heavy work lives
 * in {@see SiteAudit}; this controller is just the HTTP seam.
 */
final class DashboardController extends BaseRestController {
	public function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/dashboard',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'get_report' ],
				'permission_callback' => [ $this, 'manage_permission' ],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/dashboard/scan',
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'scan' ],
				'permission_callback' => [ $this, 'manage_permission' ],
			]
		);
	}

	public function get_report( WP_REST_Request $request ): WP_REST_Response {
		unset( $request );
		return new WP_REST_Response( SiteAudit::instance()->report() );
	}

	public function scan( WP_REST_Request $request ): WP_REST_Response {
		unset( $request );
		return new WP_REST_Response( SiteAudit::instance()->scan() );
	}
}
