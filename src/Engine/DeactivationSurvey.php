<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Engine;

use Flexa\SeoAeo\Support\SingletonTrait;

defined( 'ABSPATH' ) || exit;

/**
 * Wires the reusable Deactivation Intelligence client SDK into the plugin.
 *
 * Runs only on the Plugins screen and never blocks deactivation: the SDK is a
 * progressive enhancement over the native Deactivate link. The bundled SDK
 * lives outside the PSR-4 namespace (a plain class in `libraries/`), so it is
 * required explicitly here.
 */
final class DeactivationSurvey {

	use SingletonTrait;

	/** Central platform base URL (no trailing slash). */
	private const API_URL = 'https://product-intelligence.flexacommerce.com';

	protected function __construct() {
		if ( ! apply_filters( 'flexa_seo_aeo/deactivation_survey/enabled', true ) ) {
			return;
		}

		$sdk = FLEXA_SEO_AEO_PATH . 'libraries/deactivation-intelligence/src/class-deactivation-intelligence.php';
		if ( ! is_readable( $sdk ) ) {
			return;
		}
		require_once $sdk;

		if ( ! class_exists( \Deactivation_Intelligence::class ) ) {
			return;
		}

		\Deactivation_Intelligence::init(
			apply_filters(
				'flexa_seo_aeo/deactivation_survey/config',
				array(
					'product'     => 'flexa-seo-aeo', // must match the dashboard product slug.
					'tier'        => 'free',           // 'free' | 'pro'.
					'version'     => FLEXA_SEO_AEO_VERSION,
					'plugin_file' => FLEXA_SEO_AEO_BASENAME,
					'api_url'     => self::API_URL,
				)
			)
		);
	}
}
