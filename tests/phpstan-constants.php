<?php
/**
 * PHPStan bootstrap: define the FLEXA_SEO_AEO_* constants with literal values.
 *
 * The real definitions live in the main plugin file, but they sit *after* an
 * early `return` in the PHP-version guard, so phpstan's static scan treats them
 * as conditionally reached and won't register them. Defining them here (loaded
 * via `bootstrapFiles`) makes them known across the analysed src/ tree.
 *
 * @package Flexa\SeoAeo
 */

declare(strict_types=1);

// Refuse direct web access, but allow the PHPStan CLI bootstrap (no ABSPATH there).
defined( 'ABSPATH' ) || 'cli' === PHP_SAPI || exit;

define( 'FLEXA_SEO_AEO_VERSION', '0.1.0' );
define( 'FLEXA_SEO_AEO_FILE', __FILE__ );
define( 'FLEXA_SEO_AEO_PATH', dirname( __DIR__ ) . '/' );
define( 'FLEXA_SEO_AEO_URL', 'https://example.test/wp-content/plugins/flexa-seo-aeo/' );
define( 'FLEXA_SEO_AEO_BASENAME', 'flexa-seo-aeo/flexa-seo-aeo.php' );
define( 'FLEXA_SEO_AEO_REST_NAMESPACE', 'flexa-seo-aeo/v1' );
define( 'FLEXA_SEO_AEO_TEXT_DOMAIN', 'flexa-seo-aeo' );
