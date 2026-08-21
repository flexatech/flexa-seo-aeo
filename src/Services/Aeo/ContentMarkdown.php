<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Services\Aeo;

use Flexa\SeoAeo\Support\SingletonTrait;
use WP_Post;

defined( 'ABSPATH' ) || exit;

/**
 * Renders a post into clean Markdown for the Agent Readiness export
 * (`?flexa-aeo=md`). AI crawlers and coding agents ingest tokens far more
 * cheaply from Markdown than from theme-wrapped HTML, so serving a stripped,
 * structure-preserving variant is the AEO analogue of a print stylesheet. Pure
 * logic: it takes a post, returns a string, and performs no output or escaping.
 */
final class ContentMarkdown {
	use SingletonTrait;

	/**
	 * Build the full Markdown document (front-matter-style header + body) for a
	 * post. The content is run through `the_content` first so blocks, shortcodes
	 * and embeds resolve to their rendered HTML before conversion.
	 */
	public function render( WP_Post $post ): string {
		$parts   = [];
		$parts[] = '# ' . $this->one_line( (string) get_the_title( $post ) );
		$parts[] = '';

		$meta   = [];
		$meta[] = 'URL: ' . (string) get_permalink( $post );

		$published = get_post_time( 'c', true, $post );
		if ( is_string( $published ) && '' !== $published ) {
			$meta[] = 'Published: ' . $published;
		}
		$modified = get_post_modified_time( 'c', true, $post );
		if ( is_string( $modified ) && '' !== $modified ) {
			$meta[] = 'Updated: ' . $modified;
		}
		$author = (string) get_the_author_meta( 'display_name', (int) $post->post_author );
		if ( '' !== $author ) {
			$meta[] = 'Author: ' . $this->one_line( $author );
		}

		$parts[] = implode( "\n", $meta );
		$parts[] = '';

		// Running WordPress core's own `the_content` filter, so it is not (and
		// cannot be) plugin-prefixed.
		/** @var string $html */
		$html    = apply_filters( 'the_content', $post->post_content ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
		$parts[] = $this->convert( $html );

		$document = rtrim( implode( "\n", $parts ) ) . "\n";

		/**
		 * Filters the rendered Markdown document for a post.
		 *
		 * @param string  $document
		 * @param WP_Post $post
		 */
		return (string) apply_filters( 'flexa_seo_aeo/aeo/markdown', $document, $post );
	}

	/**
	 * Convert an HTML fragment to Markdown via a DOM walk. Falls back to a plain
	 * stripped string if the document can't be parsed.
	 */
	private function convert( string $html ): string {
		$html = trim( $html );
		if ( '' === $html ) {
			return '';
		}

		$dom  = new \DOMDocument();
		$prev = libxml_use_internal_errors( true );
		// The XML encoding hint keeps DOMDocument from mangling UTF-8; the wrapper
		// gives us a single, predictable body to walk.
		$dom->loadHTML(
			'<?xml encoding="UTF-8"?><html><body>' . $html . '</body></html>',
			LIBXML_NOWARNING | LIBXML_NOERROR
		);
		libxml_clear_errors();
		libxml_use_internal_errors( $prev );

		$body = $dom->getElementsByTagName( 'body' )->item( 0 );
		if ( ! $body instanceof \DOMNode ) {
			return $this->one_line( wp_strip_all_tags( $html ) );
		}

		return $this->tidy( $this->render_children( $body ) );
	}

	private function render_children( \DOMNode $node ): string {
		$out = '';
		foreach ( $node->childNodes as $child ) {
			$out .= $this->render_node( $child );
		}

		return $out;
	}

	private function render_node( \DOMNode $node ): string {
		if ( XML_TEXT_NODE === $node->nodeType ) {
			return (string) preg_replace( '/\s+/', ' ', (string) $node->nodeValue );
		}

		if ( ! $node instanceof \DOMElement ) {
			return '';
		}

		$tag = strtolower( $node->nodeName );

		switch ( $tag ) {
			case 'h1':
			case 'h2':
			case 'h3':
			case 'h4':
			case 'h5':
			case 'h6':
				$level = (int) substr( $tag, 1 );
				return "\n\n" . str_repeat( '#', $level ) . ' ' . trim( $this->render_children( $node ) ) . "\n\n";

			case 'p':
			case 'div':
			case 'section':
			case 'article':
			case 'header':
			case 'footer':
			case 'figure':
			case 'figcaption':
				return "\n\n" . trim( $this->render_children( $node ) ) . "\n\n";

			case 'br':
				return "  \n";

			case 'strong':
			case 'b':
				return '**' . trim( $this->render_children( $node ) ) . '**';

			case 'em':
			case 'i':
				return '*' . trim( $this->render_children( $node ) ) . '*';

			case 'a':
				$href = trim( $node->getAttribute( 'href' ) );
				$text = trim( $this->render_children( $node ) );
				if ( '' === $text ) {
					return '';
				}
				return '' !== $href ? sprintf( '[%s](%s)', $text, $href ) : $text;

			case 'img':
				$src = trim( $node->getAttribute( 'src' ) );
				$alt = $this->one_line( $node->getAttribute( 'alt' ) );
				return '' !== $src ? sprintf( '![%s](%s)', $alt, $src ) : '';

			case 'ul':
				return "\n\n" . $this->render_list( $node, false ) . "\n\n";

			case 'ol':
				return "\n\n" . $this->render_list( $node, true ) . "\n\n";

			case 'blockquote':
				return "\n\n" . $this->prefix_lines( trim( $this->render_children( $node ) ), '> ' ) . "\n\n";

			case 'pre':
				return "\n\n```\n" . trim( (string) $node->textContent ) . "\n```\n\n";

			case 'code':
				return '`' . trim( (string) $node->textContent ) . '`';

			case 'hr':
				return "\n\n---\n\n";

			case 'script':
			case 'style':
			case 'noscript':
			case 'svg':
				return '';

			default:
				return $this->render_children( $node );
		}
	}

	private function render_list( \DOMElement $element, bool $ordered ): string {
		$lines = [];
		$index = 1;

		foreach ( $element->childNodes as $item ) {
			if ( ! $item instanceof \DOMElement || 'li' !== strtolower( $item->nodeName ) ) {
				continue;
			}

			$text = $this->one_line( $this->render_children( $item ) );
			if ( '' === $text ) {
				continue;
			}

			if ( $ordered ) {
				$lines[] = $index . '. ' . $text;
				++$index;
			} else {
				$lines[] = '- ' . $text;
			}
		}

		return implode( "\n", $lines );
	}

	private function prefix_lines( string $text, string $prefix ): string {
		$lines = explode( "\n", $text );

		return implode( "\n", array_map( static fn( string $line ): string => $prefix . $line, $lines ) );
	}

	/**
	 * Collapse runs of blank lines to a single blank line and trim the edges.
	 */
	private function tidy( string $markdown ): string {
		$markdown = (string) preg_replace( "/[ \t]+\n/", "\n", $markdown );
		$markdown = (string) preg_replace( "/\n{3,}/", "\n\n", $markdown );

		return trim( $markdown ) . "\n";
	}

	private function one_line( string $text ): string {
		return trim( (string) preg_replace( '/\s+/', ' ', $text ) );
	}
}
