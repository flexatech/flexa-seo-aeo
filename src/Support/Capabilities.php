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
	public const SCAN     = 'edit_others_posts';
	public const SETTINGS = 'manage_options';

	/**
	 * Can the current user edit per-post SEO (metabox, content analysis)?
	 */
	public static function can_manage(): bool {
		return current_user_can( apply_filters( 'flexa_seo_aeo/capabilities/manage', self::MANAGE ) );
	}

	/**
	 * Can the current user run a full site scan? Stronger than {@see can_manage}
	 * because a scan is an expensive site-wide write (it scores every post and
	 * caches a trend snapshot), so it is scoped to roles that already reach all
	 * content — Editors and Administrators, not Authors or Contributors. Reading
	 * the cached report stays on the lower manage capability.
	 */
	public static function can_scan(): bool {
		return current_user_can( apply_filters( 'flexa_seo_aeo/capabilities/scan', self::SCAN ) );
	}

	/**
	 * Can the current user change global plugin settings?
	 */
	public static function can_manage_settings(): bool {
		return current_user_can( apply_filters( 'flexa_seo_aeo/capabilities/settings', self::SETTINGS ) );
	}
}
