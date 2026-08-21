/**
 * Editor script for the Flexa AEO Sitemap block.
 *
 * A dynamic block: the frontend markup is produced by the PHP render_callback
 * (which reuses the same Sitemap service as the XML sitemap), so `save` returns
 * null and the editor shows a live server-rendered preview. Written against the
 * `wp.*` globals — no build step — and enqueued with the wp-* script deps.
 */
( function ( wp ) {
	'use strict';

	if ( ! wp || ! wp.blocks || ! wp.element ) {
		return;
	}

	var el = wp.element.createElement;
	var useBlockProps = wp.blockEditor.useBlockProps;
	var ServerSideRender = wp.serverSideRender;
	var __ = wp.i18n.__;

	wp.blocks.registerBlockType( 'flexa-seo-aeo/sitemap', {
		edit: function () {
			var blockProps = useBlockProps();

			return el(
				'div',
				blockProps,
				el( ServerSideRender, {
					block: 'flexa-seo-aeo/sitemap',
					EmptyResponsePlaceholder: function () {
						return el(
							'p',
							{ style: { opacity: 0.7 } },
							__(
								'No published content to list yet.',
								'flexa-seo-aeo'
							)
						);
					},
				} )
			);
		},
		save: function () {
			// Dynamic block — rendered by the PHP render_callback.
			return null;
		},
	} );
} )( window.wp );
