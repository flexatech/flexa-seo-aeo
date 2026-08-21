/**
 * Flexa AEO — block-editor sidebar for per-post SEO/AEO overrides.
 *
 * Reads and writes the post meta registered by Domain\PostMetaRepository
 * (the `_flexa_seo_aeo_*` keys, exposed via register_post_meta + show_in_rest).
 * Written against the `wp.*` globals so it needs no build step; enqueued with
 * the wp-plugins / wp-editor / wp-components / wp-core-data deps.
 */
( function ( wp ) {
	'use strict';

	if ( ! wp || ! wp.plugins || ! wp.element || ! wp.coreData ) {
		return;
	}

	var el = wp.element.createElement;
	var Fragment = wp.element.Fragment;
	var registerPlugin = wp.plugins.registerPlugin;
	var useSelect = wp.data.useSelect;
	var useEntityProp = wp.coreData.useEntityProp;
	var comp = wp.components;
	var __ = wp.i18n.__;

	// PluginSidebar moved from wp.editPost to wp.editor in recent WP; support both.
	var editorApi = wp.editor || {};
	var editPostApi = wp.editPost || {};
	var PluginSidebar =
		editorApi.PluginSidebar || editPostApi.PluginSidebar;
	var PluginSidebarMoreMenuItem =
		editorApi.PluginSidebarMoreMenuItem ||
		editPostApi.PluginSidebarMoreMenuItem;

	if ( ! PluginSidebar || ! useEntityProp ) {
		return;
	}

	var PREFIX = '_flexa_seo_aeo_';
	var SIDEBAR = 'flexa-seo-aeo-sidebar';

	function Sidebar() {
		var postType = useSelect( function ( select ) {
			return select( 'core/editor' ).getCurrentPostType();
		}, [] );

		var entity = useEntityProp( 'postType', postType, 'meta' );
		var meta = entity[ 0 ] || {};
		var setMeta = entity[ 1 ];

		function set( key, value ) {
			var next = Object.assign( {}, meta );
			next[ PREFIX + key ] = value;
			setMeta( next );
		}
		function str( key ) {
			var v = meta[ PREFIX + key ];
			return typeof v === 'string' ? v : '';
		}
		function bool( key ) {
			return !! meta[ PREFIX + key ];
		}

		function text( key, label, help ) {
			return el( comp.TextControl, {
				__nextHasNoMarginBottom: true,
				label: label,
				help: help,
				value: str( key ),
				onChange: function ( value ) {
					set( key, value );
				},
			} );
		}
		function textarea( key, label, help ) {
			return el( comp.TextareaControl, {
				__nextHasNoMarginBottom: true,
				label: label,
				help: help,
				value: str( key ),
				onChange: function ( value ) {
					set( key, value );
				},
			} );
		}
		function toggle( key, label, help ) {
			return el( comp.ToggleControl, {
				__nextHasNoMarginBottom: true,
				label: label,
				help: help,
				checked: bool( key ),
				onChange: function ( value ) {
					set( key, !! value );
				},
			} );
		}

		return el(
			Fragment,
			null,
			el(
				PluginSidebarMoreMenuItem,
				{ target: SIDEBAR, icon: 'search' },
				__( 'Flexa AEO', 'flexa-seo-aeo' )
			),
			el(
				PluginSidebar,
				{
					name: SIDEBAR,
					title: __( 'Flexa AEO', 'flexa-seo-aeo' ),
					icon: 'search',
				},
				el(
					comp.PanelBody,
					{ title: __( 'Search Appearance', 'flexa-seo-aeo' ), initialOpen: true },
					text(
						'title',
						__( 'SEO title', 'flexa-seo-aeo' ),
						__( 'Overrides the computed <title>. Supports %%tokens%%.', 'flexa-seo-aeo' )
					),
					textarea(
						'description',
						__( 'Meta description', 'flexa-seo-aeo' ),
						__( 'The snippet search and answer engines may show.', 'flexa-seo-aeo' )
					),
					text(
						'canonical',
						__( 'Canonical URL', 'flexa-seo-aeo' ),
						__( 'Leave blank to use this post’s permalink.', 'flexa-seo-aeo' )
					)
				),
				el(
					comp.PanelBody,
					{ title: __( 'Robots', 'flexa-seo-aeo' ), initialOpen: false },
					toggle(
						'noindex',
						__( 'No index', 'flexa-seo-aeo' ),
						__( 'Ask engines not to index this page (also excludes it from the sitemap and llms.txt).', 'flexa-seo-aeo' )
					),
					toggle(
						'nofollow',
						__( 'No follow', 'flexa-seo-aeo' ),
						__( 'Ask engines not to follow links on this page.', 'flexa-seo-aeo' )
					)
				),
				el(
					comp.PanelBody,
					{ title: __( 'Open Graph', 'flexa-seo-aeo' ), initialOpen: false },
					text( 'og_title', __( 'OG title', 'flexa-seo-aeo' ) ),
					textarea( 'og_description', __( 'OG description', 'flexa-seo-aeo' ) ),
					text(
						'og_image',
						__( 'OG image URL', 'flexa-seo-aeo' ),
						__( 'Falls back to the featured image.', 'flexa-seo-aeo' )
					)
				),
				el(
					comp.PanelBody,
					{ title: __( 'X (Twitter)', 'flexa-seo-aeo' ), initialOpen: false },
					text( 'twitter_title', __( 'Card title', 'flexa-seo-aeo' ) ),
					textarea( 'twitter_description', __( 'Card description', 'flexa-seo-aeo' ) ),
					text( 'twitter_image', __( 'Card image URL', 'flexa-seo-aeo' ) )
				)
			)
		);
	}

	registerPlugin( SIDEBAR, { render: Sidebar, icon: 'search' } );
} )( window.wp );
