<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Rest;

use Flexa\SeoAeo\Support\Resetter;
use Flexa\SeoAeo\Support\Settings;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * GET/POST /wp-json/flexa-seo-aeo/v1/settings — returns or persists the
 * plugin's settings option.
 *
 * POST /wp-json/flexa-seo-aeo/v1/settings/reset — danger-zone wipe.
 *
 * The schema, defaults, and sanitization live in {@see Settings} so the
 * frontend meta/sitemap services, the AEO generator, and the CLI share one
 * source of truth.
 */
final class SettingsController extends BaseRestController {
	public const OPTION_KEY = Settings::OPTION_KEY;

	public function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/settings',
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_settings' ],
					'permission_callback' => [ $this, 'settings_permission' ],
				],
				[
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'update_settings' ],
					'permission_callback' => [ $this, 'settings_permission' ],
				],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/settings/reset',
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'reset_settings' ],
				'permission_callback' => [ $this, 'settings_permission' ],
			]
		);
	}

	public function get_settings( WP_REST_Request $request ): WP_REST_Response {
		unset( $request );
		return new WP_REST_Response( Settings::all() );
	}

	public function update_settings( WP_REST_Request $request ): WP_REST_Response {
		// get_json_params() returns null on an empty/invalid body; the cast
		// normalises that to an empty array.
		$incoming = (array) $request->get_json_params();

		$old   = Settings::all();
		$clean = Settings::sanitize( $incoming );
		// Partial updates: merge the sanitized payload over what is stored so a
		// screen that submits one toggle never wipes the rest.
		$new = array_merge( $old, $clean );
		update_option( self::OPTION_KEY, $new );

		/**
		 * Fires after settings are persisted. Frontend services and the AEO
		 * route builder hook this to react to a toggle flip (e.g. schedule a
		 * rewrite-rule flush when a sitemap/llms.txt route turns on).
		 *
		 * @param array<string, mixed> $new Full settings after the write.
		 * @param array<string, mixed> $old Full settings before the write.
		 */
		do_action( 'flexa_seo_aeo/settings/updated', $new, $old );

		return $this->get_settings( $request );
	}

	public function reset_settings( WP_REST_Request $request ): WP_REST_Response {
		unset( $request );
		$result = Resetter::reset_all();
		return new WP_REST_Response( $result );
	}
}
