<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Install;

defined( 'ABSPATH' ) || exit;

final class Deactivator {
	public static function deactivate(): void {
		// Drop the plugin's rewrite rules (sitemaps, /llms.txt) so a
		// deactivated plugin leaves no dangling routes behind.
		flush_rewrite_rules();
	}
}
