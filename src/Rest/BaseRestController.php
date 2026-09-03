<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Rest;

use Flexa\SeoAeo\Support\Capabilities;
use WP_Error;
use WP_REST_Request;

defined( 'ABSPATH' ) || exit;

/**
 * Base class for REST controllers. Provides permission callbacks shared by
 * every endpoint so individual controllers never forget the gate.
 */
abstract class BaseRestController {
	public const NAMESPACE = FLEXA_SEO_AEO_REST_NAMESPACE;

	abstract public function register_routes(): void;

	public function manage_permission( WP_REST_Request $request ): bool|WP_Error {
		unset( $request );
		if ( ! Capabilities::can_manage() ) {
			return new WP_Error(
				'flexa_seo_aeo_forbidden',
				__( 'You do not have permission to perform this action.', 'flexa-seo-aeo' ),
				[ 'status' => rest_authorization_required_code() ]
			);
		}
		return true;
	}

	public function scan_permission( WP_REST_Request $request ): bool|WP_Error {
		unset( $request );
		if ( ! Capabilities::can_scan() ) {
			return new WP_Error(
				'flexa_seo_aeo_forbidden',
				__( 'You do not have permission to run a site scan.', 'flexa-seo-aeo' ),
				[ 'status' => rest_authorization_required_code() ]
			);
		}
		return true;
	}

	public function settings_permission( WP_REST_Request $request ): bool|WP_Error {
		unset( $request );
		if ( ! Capabilities::can_manage_settings() ) {
			return new WP_Error(
				'flexa_seo_aeo_forbidden',
				__( 'You do not have permission to update settings.', 'flexa-seo-aeo' ),
				[ 'status' => rest_authorization_required_code() ]
			);
		}
		return true;
	}
}
