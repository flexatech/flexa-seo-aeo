/**
 * Flexa SEO — block-editor sidebar for per-post SEO/AEO overrides.
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
	var useState = wp.element.useState;
	var useEffect = wp.element.useEffect;
	var useRef = wp.element.useRef;
	var registerPlugin = wp.plugins.registerPlugin;
	var useSelect = wp.data.useSelect;
	var useEntityProp = wp.coreData.useEntityProp;
	var apiFetch = wp.apiFetch;
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

	var STATUS = {
		pass: { icon: '✓', color: '#16a34a' },
		warn: { icon: '⚠', color: '#d97706' },
		fail: { icon: '✗', color: '#dc2626' },
	};

	var GRADE_LABEL = {
		excellent: __( 'Excellent', 'flexa-seo-aeo' ),
		good: __( 'Good', 'flexa-seo-aeo' ),
		fair: __( 'Fair', 'flexa-seo-aeo' ),
		poor: __( 'Needs work', 'flexa-seo-aeo' ),
	};

	function gradeColor( grade ) {
		if ( grade === 'excellent' || grade === 'good' ) {
			return STATUS.pass.color;
		}
		if ( grade === 'fair' ) {
			return STATUS.warn.color;
		}
		return STATUS.fail.color;
	}

	/**
	 * Answer-Engine Readiness score + checklist. Fetches the report from the REST
	 * endpoint on mount and re-fetches after each successful (non-autosave) save,
	 * so the score tracks the content the editor is actually working on.
	 */
	function ReadinessPanel() {
		var postId = useSelect( function ( select ) {
			return select( 'core/editor' ).getCurrentPostId();
		}, [] );
		var isSaving = useSelect( function ( select ) {
			var editor = select( 'core/editor' );
			return editor.isSavingPost() && ! editor.isAutosavingPost();
		}, [] );

		var reportState = useState( null );
		var report = reportState[ 0 ];
		var setReport = reportState[ 1 ];
		var loadingState = useState( false );
		var loading = loadingState[ 0 ];
		var setLoading = loadingState[ 1 ];
		var wasSaving = useRef( false );

		function load() {
			if ( ! postId || ! apiFetch ) {
				return;
			}
			setLoading( true );
			apiFetch( { path: '/flexa-seo-aeo/v1/readiness/' + postId } )
				.then( function ( data ) {
					setReport( data );
					setLoading( false );
				} )
				.catch( function () {
					setLoading( false );
				} );
		}

		useEffect( function () {
			load();
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [ postId ] );

		useEffect( function () {
			if ( wasSaving.current && ! isSaving ) {
				load();
			}
			wasSaving.current = isSaving;
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [ isSaving ] );

		var body = [];

		if ( ! report ) {
			body.push(
				el(
					'p',
					{ key: 'empty', style: { color: '#64748b', margin: 0 } },
					loading
						? __( 'Scoring…', 'flexa-seo-aeo' )
						: __( 'Save the post to calculate its readiness score.', 'flexa-seo-aeo' )
				)
			);
		} else {
			var color = gradeColor( report.grade );

			body.push(
				el(
					'div',
					{
						key: 'score',
						style: {
							display: 'flex',
							alignItems: 'baseline',
							gap: '8px',
							marginBottom: '10px',
						},
					},
					el(
						'span',
						{ style: { fontSize: '28px', fontWeight: 700, color: color, lineHeight: 1 } },
						String( report.score )
					),
					el( 'span', { style: { color: '#64748b' } }, '/ 100' ),
					el(
						'span',
						{ style: { marginLeft: 'auto', fontWeight: 600, color: color } },
						GRADE_LABEL[ report.grade ] || report.grade
					)
				)
			);

			var items = ( report.checks || [] ).map( function ( check ) {
				var meta = STATUS[ check.status ] || STATUS.fail;
				return el(
					'li',
					{
						key: check.id,
						style: {
							display: 'flex',
							gap: '8px',
							padding: '6px 0',
							borderTop: '1px solid #f1f5f9',
						},
					},
					el(
						'span',
						{ style: { color: meta.color, fontWeight: 700, flex: '0 0 auto' }, 'aria-hidden': true },
						meta.icon
					),
					el(
						'span',
						null,
						el( 'span', { style: { fontWeight: 600 } }, check.label ),
						el(
							'span',
							{ style: { display: 'block', color: '#64748b', fontSize: '12px', marginTop: '2px' } },
							check.hint
						)
					)
				);
			} );

			body.push(
				el(
					'ul',
					{ key: 'checks', style: { listStyle: 'none', margin: 0, padding: 0 } },
					items
				)
			);
		}

		body.push(
			el(
				comp.Button,
				{
					key: 'refresh',
					variant: 'link',
					isBusy: loading,
					disabled: loading || ! postId,
					onClick: load,
					style: { marginTop: '8px' },
				},
				__( 'Re-check readiness', 'flexa-seo-aeo' )
			)
		);

		return el(
			comp.PanelBody,
			{ title: __( 'Answer-Engine Readiness', 'flexa-seo-aeo' ), initialOpen: true },
			body
		);
	}

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
				__( 'Flexa SEO', 'flexa-seo-aeo' )
			),
			el(
				PluginSidebar,
				{
					name: SIDEBAR,
					title: __( 'Flexa SEO', 'flexa-seo-aeo' ),
					icon: 'search',
				},
				el( ReadinessPanel, { key: 'readiness' } ),
				el(
					comp.PanelBody,
					{ title: __( 'Search Appearance', 'flexa-seo-aeo' ), initialOpen: false },
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
