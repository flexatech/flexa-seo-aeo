<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Actions\Woo;

use Flexa\SeoAeo\Support\Settings;
use Flexa\SeoAeo\Support\SingletonTrait;
use WC_Product;

defined( 'ABSPATH' ) || exit;

/**
 * Open Graph enrichment for WooCommerce product pages: overrides `og:type` to
 * `product` and appends the `product:price:*` / availability tags Facebook and
 * chat-app unfurlers read for rich commerce previews. Hooks the OG seam in
 * {@see \Flexa\SeoAeo\Actions\Front\Metas} so the core meta layer stays
 * commerce-agnostic. Gated by `open_graph`; only booted with WooCommerce active.
 */
final class ProductMeta {
	use SingletonTrait;

	public function register(): void {
		if ( is_admin() ) {
			return;
		}

		add_filter( 'flexa_seo_aeo/front/og', [ $this, 'add_product_tags' ] );
	}

	/**
	 * @param array<string, string> $og
	 * @return array<string, string>
	 */
	public function add_product_tags( array $og ): array {
		if ( ! (bool) Settings::get( 'open_graph' ) ) {
			return $og;
		}
		if ( ! function_exists( 'is_product' ) || ! is_product() || ! function_exists( 'wc_get_product' ) ) {
			return $og;
		}

		$product = wc_get_product();
		if ( ! $product instanceof WC_Product ) {
			return $og;
		}

		$og['og:type'] = 'product';

		$price = $this->price( $product );
		if ( '' !== $price ) {
			$og['product:price:amount'] = $price;
			if ( function_exists( 'get_woocommerce_currency' ) ) {
				$og['product:price:currency'] = (string) get_woocommerce_currency();
			}
		}

		$og['product:availability'] = $product->is_in_stock() ? 'in stock' : 'out of stock';
		$og['og:availability']      = $product->is_in_stock() ? 'instock' : 'oos';

		return $og;
	}

	private function price( WC_Product $product ): string {
		if ( $product->is_type( 'variable' ) && method_exists( $product, 'get_variation_price' ) ) {
			$value = $product->get_variation_price( 'min', true );
		} elseif ( function_exists( 'wc_get_price_to_display' ) ) {
			$value = wc_get_price_to_display( $product );
		} else {
			$value = $product->get_price();
		}

		if ( '' === (string) $value || ! is_numeric( $value ) ) {
			return '';
		}

		if ( function_exists( 'wc_format_decimal' ) && function_exists( 'wc_get_price_decimals' ) ) {
			return (string) wc_format_decimal( $value, wc_get_price_decimals() );
		}

		return (string) $value;
	}
}
