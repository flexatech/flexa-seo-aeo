<?php
/**
 * Sub-sitemap (urlset) template.
 *
 * @var list<array{loc: string, lastmod: string, images: list<string>}> $entries
 * @var string                                                          $stylesheet
 * @var bool                                                            $with_images
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
if ( '' !== $stylesheet ) {
	echo '<?xml-stylesheet type="text/xsl" href="' . esc_url( $stylesheet ) . '"?>' . "\n";
}
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"<?php echo $with_images ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ''; ?>>
<?php foreach ( $entries as $entry ) : // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Loop var local to this template partial (required from a controller), not a global. ?>
	<url>
		<loc><?php echo esc_url( $entry['loc'] ); ?></loc>
	<?php if ( '' !== $entry['lastmod'] ) : ?>
		<lastmod><?php echo esc_xml( $entry['lastmod'] ); ?></lastmod>
<?php endif; ?>
	<?php if ( $with_images ) : ?>
		<?php foreach ( $entry['images'] as $image ) : // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Loop var local to this template partial (required from a controller), not a global. ?>
		<image:image>
			<image:loc><?php echo esc_url( $image ); ?></image:loc>
		</image:image>
<?php endforeach; ?>
<?php endif; ?>
	</url>
<?php endforeach; ?>
</urlset>
