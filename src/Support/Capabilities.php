<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Support;

defined( 'ABSPATH' ) || exit;

/**
 * Capability helpers. Extensions (and the future Pro build) can hook the
 * filters below to inject per-role scoping without touching core.
 */
final class Capabilities {
	public const MANAGE   = 'edit_posts';
	public const SETTINGS = 'manage_options';

	/**
	 * Can the current user edit per-post SEO (metabox, content analysis)?
	 */
	public static function can_manage(): bool {
		return current_user_can( apply_filters( 'flexa_seo_aeo/capabilities/manage', self::MANAGE ) );
	}

	/**
	 * Can the current user change global plugin settings?
	 */
	public static function can_manage_settings(): bool {
		return current_user_can( apply_filters( 'flexa_seo_aeo/capabilities/settings', self::SETTINGS ) );
	}
}
