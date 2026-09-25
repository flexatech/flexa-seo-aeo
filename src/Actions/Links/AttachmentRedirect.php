<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Actions\Links;

use Flexa\SeoAeo\Support\Settings;
use Flexa\SeoAeo\Support\SingletonTrait;

defined( 'ABSPATH' ) || exit;

/**
 * Redirects attachment (media) pages, which are thin, duplicate URLs that dilute
 * crawl budget and add nothing for AI answer engines:
 *
 *  - Redirect Attachments        → send an attachment page to its parent post.
 *  - Redirect Orphan Attachments → attachments with no parent go to a fallback
 *                                  URL (empty = leave the page as-is).
 */
final class AttachmentRedirect {
	use SingletonTrait;

	public function register(): void {
		// `template_redirect` fires after the main query resolves and before any
		// output, the standard place to issue a front-end redirect.
		add_action( 'template_redirect', [ $this, 'maybe_redirect' ] );
	}

	public function maybe_redirect(): void {
		if ( ! is_attachment() || ! (bool) Settings::get( 'redirect_attachments' ) ) {
			return;
		}

		$post = get_post();
		if ( ! $post ) {
			return;
		}

		$target = $post->post_parent > 0
			? (string) get_permalink( $post->post_parent )
			: trim( (string) Settings::get( 'redirect_orphan_attachments' ) );

		if ( '' === $target ) {
			return;
		}

		/**
		 * Filter the attachment redirect destination.
		 *
		 * @param string   $target Resolved redirect URL.
		 * @param \WP_Post $post   The attachment being redirected.
		 */
		$target = (string) apply_filters( 'flexa_seo_aeo/links/attachment_redirect_url', $target, $post );
		if ( '' === $target ) {
			return;
		}

		// wp_redirect (not wp_safe_redirect): the orphan-attachment fallback is an
		// admin-entered URL that may intentionally point off-site, and the value
		// is already esc_url_raw-sanitised on save (see Settings::sanitize).
		wp_redirect( $target, 301 ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect
		exit;
	}
}
