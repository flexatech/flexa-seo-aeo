<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Services\Onboarding;

use Flexa\SeoAeo\Support\Settings;
use Flexa\SeoAeo\Support\SingletonTrait;

defined( 'ABSPATH' ) || exit;

/**
 * The Setup Assistant's recommended-settings engine. Given the live settings and
 * the detection payload, it returns a curated, safe set of settings the wizard
 * can turn on in one click, each tagged with how it relates to the current value.
 *
 * The compare-to-defaults rule keeps Apply non-destructive: a setting is only a
 * candidate to enable/prefill when its current value still equals the schema
 * default. Anything the user changed is surfaced as `user_configured_skip` and
 * never written. See docs/onboarding-design.md §4.
 */
final class Recommended {
	use SingletonTrait;

	/**
	 * Both recommendation scopes for `GET /onboarding`.
	 *
	 * @param array<string, mixed> $detect The Detector payload.
	 * @return array{seo: list<array<string, mixed>>, aeo: list<array<string, mixed>>}
	 */
	public function all( array $detect ): array {
		return [
			'seo' => $this->seo( $detect ),
			'aeo' => $this->aeo( $detect ),
		];
	}

	/**
	 * @param array<string, mixed> $detect
	 * @return list<array<string, mixed>>
	 */
	private function seo( array $detect ): array {
		$settings  = Settings::all();
		$site_name = is_string( $detect['site_name'] ?? null ) ? $detect['site_name'] : '';

		$items = [
			$this->bool_item( 'titles_metas', __( 'Titles & meta descriptions', 'flexa-seo-aeo' ), (bool) ( $settings['titles_metas'] ?? false ) ),
			$this->bool_item( 'xml_sitemap', __( 'XML sitemap', 'flexa-seo-aeo' ), (bool) ( $settings['xml_sitemap'] ?? false ) ),
			$this->bool_item( 'open_graph', __( 'Open Graph (social sharing)', 'flexa-seo-aeo' ), (bool) ( $settings['open_graph'] ?? false ) ),
			$this->bool_item( 'twitter_cards', __( 'Twitter / X cards', 'flexa-seo-aeo' ), (bool) ( $settings['twitter_cards'] ?? false ) ),
			$this->string_item(
				'knowledge_name',
				__( 'Knowledge graph name', 'flexa-seo-aeo' ),
				is_string( $settings['knowledge_name'] ?? null ) ? $settings['knowledge_name'] : '',
				$site_name
			),
		];

		return array_values( array_filter( $items ) );
	}

	/**
	 * @param array<string, mixed> $detect
	 * @return list<array<string, mixed>>
	 */
	private function aeo( array $detect ): array {
		$tagline = is_string( $detect['tagline'] ?? null ) ? $detect['tagline'] : '';

		$items = [
			$this->bool_item( 'aeo.enabled', __( 'llms.txt for AI engines', 'flexa-seo-aeo' ), (bool) Settings::get_aeo( 'enabled' ) ),
			$this->bool_item( 'aeo.schema', __( 'Structured data (Article, FAQ, HowTo)', 'flexa-seo-aeo' ), (bool) Settings::get_aeo( 'schema' ) ),
			$this->bool_item( 'aeo.agent_readiness', __( 'Agent readiness', 'flexa-seo-aeo' ), (bool) Settings::get_aeo( 'agent_readiness' ) ),
			$this->bool_item( 'aeo.plain_text_export', __( 'Markdown / plain-text alternate', 'flexa-seo-aeo' ), (bool) Settings::get_aeo( 'plain_text_export' ) ),
		];

		// Commerce schema is only meaningful (and only recommended) on a store.
		if ( ! empty( $detect['has_woocommerce'] ) ) {
			$items[] = $this->bool_item( 'aeo.commerce', __( 'Product data for AI shopping answers', 'flexa-seo-aeo' ), (bool) Settings::get_aeo( 'commerce' ) );
		}

		$items[] = $this->string_item(
			'aeo.site_description',
			__( 'AI summary', 'flexa-seo-aeo' ),
			is_string( Settings::get_aeo( 'site_description' ) ) ? (string) Settings::get_aeo( 'site_description' ) : '',
			$tagline
		);

		return array_values( array_filter( $items ) );
	}

	/**
	 * A boolean recommendation (default off, recommended on). Because the only
	 * non-default value is the recommended one, a boolean is ever only
	 * `will_enable` (currently off) or `already_on` (currently on).
	 *
	 * @return array<string, mixed>
	 */
	private function bool_item( string $key, string $label, bool $current ): array {
		return [
			'key'         => $key,
			'label'       => $label,
			'current'     => $current,
			'recommended' => true,
			'state'       => $current ? 'already_on' : 'will_enable',
		];
	}

	/**
	 * A string prefill (default empty). Prefills only into an empty field; a field
	 * the user already filled is surfaced as `already_on` (matches) or
	 * `user_configured_skip` (differs) and never overwritten. Returns null when
	 * there is nothing to recommend (an empty detected value), so the row is
	 * omitted entirely.
	 *
	 * @return array<string, mixed>|null
	 */
	private function string_item( string $key, string $label, string $current, string $recommended ): ?array {
		if ( '' === $recommended ) {
			return null;
		}

		if ( '' === $current ) {
			$state = 'will_enable';
		} elseif ( $current === $recommended ) {
			$state = 'already_on';
		} else {
			$state = 'user_configured_skip';
		}

		return [
			'key'         => $key,
			'label'       => $label,
			'current'     => $current,
			'recommended' => $recommended,
			'state'       => $state,
		];
	}
}
