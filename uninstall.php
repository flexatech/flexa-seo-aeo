<?php
/**
 * Uninstall handler. Removes every trace of Flexa SEO. Runs in isolation (the
 * plugin is NOT bootstrapped during uninstall) so it cannot use the plugin's
 * classes — the option key below is deliberately duplicated from
 * Flexa\SeoAeo\Support\Settings::OPTION_KEY. Keep them in sync.
 *
 * @package Flexa\SeoAeo
 */

declare(strict_types=1);

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

delete_option( 'flexa_seo_aeo_settings' );
