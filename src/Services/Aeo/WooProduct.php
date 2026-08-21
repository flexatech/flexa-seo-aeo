<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Services\Aeo;

use Flexa\SeoAeo\Support\SingletonTrait;

defined( 'ABSPATH' ) || exit;

/**
 * Pure builder for the WooCommerce `Product` JSON-LD node. Answer engines and
 * AI shopping surfaces lean on Product/Offer structured data to lift price,
 * availability, brand and rating out of a store page — so this is the AEO
 * payoff for commerce. It takes a plain, already-extracted data array (all the
 * WooCommerce I/O lives in the action layer) and returns a nested array; JSON
 * encoding + escaping happen downstream. Zero WooCommerce coupling on purpose:
 * this stays testable and static-analysable without the store loaded.
 */
final class WooProduct {
	use SingletonTrait;

	/**
	 * Availability strings we recognise, mapped to their schema.org URLs. Any
	 * other value is treated as no availability signal.
	 *
	 * @var array<string, string>
	 */
	private const AVAILABILITY = [
		'InStock'      => 'https://schema.org/InStock',
		'OutOfStock'   => 'https://schema.org/OutOfStock',
		'BackOrder'    => 'https://schema.org/BackOrder',
		'PreOrder'     => 'https://schema.org/PreOrder',
		'Discontinued' => 'https://schema.org/Discontinued',
	];

	/**
	 * Build the Product node from an extracted data array. Returns an empty
	 * array when there isn't enough to say anything useful (no name).
	 *
	 * @param array<string, mixed> $data {
	 *     @type string $name           Required. Product title.
	 *     @type string $description    Short/long description, plain text.
	 *     @type string $url            Canonical product permalink.
	 *     @type string $sku            Stock keeping unit.
	 *     @type string $gtin           Global unique id (GTIN/UPC/EAN/ISBN).
	 *     @type string $brand          Brand name.
	 *     @type string $image          Featured image URL.
	 *     @type bool   $variable       Whether this is a variable/range product.
	 *     @type string $price          Display price (single product).
	 *     @type string $low_price      Lowest variation price (variable product).
	 *     @type string $high_price     Highest variation price (variable product).
	 *     @type string $currency       ISO currency code.
	 *     @type string $availability   One of the AVAILABILITY keys.
	 *     @type string $price_valid_until  ISO-8601 date the price is good until.
	 *     @type float  $rating_value   Average review rating.
	 *     @type int    $rating_count   Number of ratings.
	 *     @type int    $review_count   Number of reviews.
	 * }
	 * @return array<string, mixed>
	 */
	public function node( array $data ): array {
		$name = $this->str( $data, 'name' );
		if ( '' === $name ) {
			return [];
		}

		$url  = $this->str( $data, 'url' );
		$node = [
			'@type' => 'Product',
			'name'  => $name,
		];
		if ( '' !== $url ) {
			$node['@id'] = $url . '#product';
			$node['url'] = $url;
		}

		$description = $this->str( $data, 'description' );
		if ( '' !== $description ) {
			$node['description'] = $description;
		}

		$image = $this->str( $data, 'image' );
		if ( '' !== $image ) {
			$node['image'] = $image;
		}

		$sku = $this->str( $data, 'sku' );
		if ( '' !== $sku ) {
			$node['sku'] = $sku;
		}

		$gtin = $this->str( $data, 'gtin' );
		if ( '' !== $gtin ) {
			// schema.org's generic `gtin` accepts GTIN-8/12/13/14; let AI parse it.
			$node['gtin'] = $gtin;
		}

		$brand = $this->str( $data, 'brand' );
		if ( '' !== $brand ) {
			$node['brand'] = [
				'@type' => 'Brand',
				'name'  => $brand,
			];
		}

		$offers = $this->offers( $data, $url );
		if ( [] !== $offers ) {
			$node['offers'] = $offers;
		}

		$rating = $this->aggregate_rating( $data );
		if ( [] !== $rating ) {
			$node['aggregateRating'] = $rating;
		}

		return $node;
	}

	/**
	 * Build an Offer (single product) or AggregateOffer (variable product with a
	 * price range). Empty when there's no usable price.
	 *
	 * @param array<string, mixed> $data
	 * @return array<string, mixed>
	 */
	private function offers( array $data, string $url ): array {
		$currency     = $this->str( $data, 'currency' );
		$availability = $this->availability( $this->str( $data, 'availability' ) );
		$variable     = ! empty( $data['variable'] );

		if ( $variable ) {
			$low  = $this->str( $data, 'low_price' );
			$high = $this->str( $data, 'high_price' );
			if ( '' === $low && '' === $high ) {
				return [];
			}

			$offer = [ '@type' => 'AggregateOffer' ];
			if ( '' !== $low ) {
				$offer['lowPrice'] = $low;
			}
			if ( '' !== $high ) {
				$offer['highPrice'] = $high;
			}
		} else {
			$price = $this->str( $data, 'price' );
			if ( '' === $price ) {
				return [];
			}

			$offer = [
				'@type' => 'Offer',
				'price' => $price,
			];

			$valid_until = $this->str( $data, 'price_valid_until' );
			if ( '' !== $valid_until ) {
				$offer['priceValidUntil'] = $valid_until;
			}
		}

		if ( '' !== $currency ) {
			$offer['priceCurrency'] = $currency;
		}
		if ( '' !== $url ) {
			$offer['url'] = $url;
		}
		if ( '' !== $availability ) {
			$offer['availability'] = $availability;
		}

		return $offer;
	}

	/**
	 * @param array<string, mixed> $data
	 * @return array<string, mixed>
	 */
	private function aggregate_rating( array $data ): array {
		$count = isset( $data['rating_count'] ) && is_numeric( $data['rating_count'] ) ? (int) $data['rating_count'] : 0;
		$value = isset( $data['rating_value'] ) && is_numeric( $data['rating_value'] ) ? (float) $data['rating_value'] : 0.0;
		if ( $count < 1 || $value <= 0.0 ) {
			return [];
		}

		$rating = [
			'@type'       => 'AggregateRating',
			'ratingValue' => (string) round( $value, 2 ),
			'ratingCount' => $count,
		];

		$reviews = isset( $data['review_count'] ) && is_numeric( $data['review_count'] ) ? (int) $data['review_count'] : 0;
		if ( $reviews > 0 ) {
			$rating['reviewCount'] = $reviews;
		}

		return $rating;
	}

	private function availability( string $value ): string {
		return self::AVAILABILITY[ $value ] ?? '';
	}

	/**
	 * @param array<string, mixed> $data
	 */
	private function str( array $data, string $key ): string {
		$value = $data[ $key ] ?? null;

		return is_scalar( $value ) ? trim( (string) $value ) : '';
	}
}
