<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Admin;

use Flexa\SeoAeo\Support\Capabilities;
use Flexa\SeoAeo\Support\OnboardingState;
use Flexa\SeoAeo\Support\Settings;
use Flexa\SeoAeo\Support\SingletonTrait;

defined( 'ABSPATH' ) || exit;

/**
 * First-run entry into the Setup Assistant.
 *
 * A single-plugin activation drops a short-lived, user-scoped transient (see
 * {@see \Flexa\SeoAeo\Install\Activator}); the next admin page load for that same
 * user redirects once into the wizard. Every path the redirect cannot safely
 * cover (bulk activation, WP-CLI, multisite, another user) falls back to a
 * dismissible notice on the Plugins screen. Both self-suppress once setup is
 * completed or dismissed.
 */
final class ActivationRedirect {
	use SingletonTrait;

	/** One-shot, user-scoped transient set on activation. */
	public const REDIRECT_TRANSIENT = 'flexa_seo_aeo_activation_redirect';

	private const DISMISS_ARG   = 'fsa-dismiss-setup-notice';
	private const DISMISS_NONCE = 'flexa_seo_aeo_dismiss_setup_notice';

	public function register(): void {
		add_action( 'admin_init', [ $this, 'maybe_redirect' ] );
		add_action( 'admin_init', [ $this, 'maybe_dismiss_notice' ] );
		add_action( 'admin_notices', [ $this, 'maybe_render_notice' ] );
	}

	/**
	 * Consume the activation transient and, when it is safe, send the activating
	 * admin into the wizard exactly once.
	 */
	public function maybe_redirect(): void {
		$user = get_transient( self::REDIRECT_TRANSIENT );
		if ( false === $user ) {
			return;
		}

		// One shot: delete before any guard can bail, so a blocked redirect never
		// re-fires on the next request.
		delete_transient( self::REDIRECT_TRANSIENT );

		if ( wp_doing_ajax() || is_network_admin() ) {
			return;
		}
		// Bulk activation lands on plugins.php with this flag; never hijack it.
		if ( isset( $_GET['activate-multi'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}
		if ( get_current_user_id() !== (int) $user ) {
			return;
		}
		if ( ! Capabilities::can_manage_settings() ) {
			return;
		}
		if ( OnboardingState::is_finished() ) {
			return;
		}

		wp_safe_redirect( $this->setup_url() );
		exit;
	}

	/**
	 * Persist a dismissal of the plugins-screen notice (nonce-checked) and bounce
	 * back to a clean Plugins screen.
	 */
	public function maybe_dismiss_notice(): void {
		if ( ! isset( $_GET[ self::DISMISS_ARG ] ) ) {
			return;
		}
		if ( ! Capabilities::can_manage_settings() ) {
			return;
		}

		$nonce = isset( $_GET['_wpnonce'] ) ? sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ) : '';
		if ( ! wp_verify_nonce( $nonce, self::DISMISS_NONCE ) ) {
			return;
		}

		OnboardingState::update( [ 'status' => 'dismissed' ] );

		wp_safe_redirect( admin_url( 'plugins.php' ) );
		exit;
	}

	/**
	 * Render the fallback notice: Plugins screen only, settings-capable users
	 * only, and only while setup is still pending.
	 */
	public function maybe_render_notice(): void {
		$screen = get_current_screen();
		if ( null === $screen || 'plugins' !== $screen->id ) {
			return;
		}
		if ( ! Capabilities::can_manage_settings() ) {
			return;
		}
		if ( 'pending' !== OnboardingState::get( 'status' ) ) {
			return;
		}

		$dismiss_url = wp_nonce_url(
			add_query_arg( self::DISMISS_ARG, '1', admin_url( 'plugins.php' ) ),
			self::DISMISS_NONCE
		);

		printf(
			'<div class="notice notice-info"><p>%s</p><p><a class="button button-primary" href="%s">%s</a> <a href="%s">%s</a></p></div>',
			esc_html(
				sprintf(
					/* translators: %s: plugin brand name. */
					__( '%s is active. Run the 3-minute Setup Assistant to configure SEO and AEO in a few clicks.', 'flexa-seo-aeo' ),
					Settings::brand_name()
				)
			),
			esc_url( $this->setup_url() ),
			esc_html__( 'Run Setup Assistant', 'flexa-seo-aeo' ),
			esc_url( $dismiss_url ),
			esc_html__( 'Dismiss', 'flexa-seo-aeo' )
		);
	}

	private function setup_url(): string {
		return admin_url( 'admin.php?page=' . AdminMenu::SLUG . '&fsa-view=setup' );
	}
}
