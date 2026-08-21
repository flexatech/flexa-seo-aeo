<?php
/**
 * Sitemap index template.
 *
 * @var list<array{loc: string, lastmod: string}> $entries
 * @var string                                     $stylesheet
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
if ( '' !== $stylesheet ) {
	echo '<?xml-stylesheet type="text/xsl" href="' . esc_url( $stylesheet ) . '"?>' . "\n";
}
?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<?php foreach ( $entries as $entry ) : ?>
	<sitemap>
		<loc><?php echo esc_url( $entry['loc'] ); ?></loc>
	<?php if ( '' !== $entry['lastmod'] ) : ?>
		<lastmod><?php echo esc_xml( $entry['lastmod'] ); ?></lastmod>
<?php endif; ?>
	</sitemap>
<?php endforeach; ?>
</sitemapindex>
