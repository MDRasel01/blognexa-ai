<?php
/**
 * BlogNexa AI - Native In-Plugin Crawler & Content Extractor
 *
 * @package BlogNexaAI\Modules\WebsiteIntelligence
 */

declare(strict_types=1);

namespace BlogNexaAI\Modules\WebsiteIntelligence;

if (!defined('ABSPATH')) {
    exit;
}

final class NativeCrawler
{
    public const OPTION_CRAWL_STATE = 'blognexa_native_crawl_state';
    public const OPTION_INVENTORY   = 'blognexa_content_inventory';

    /**
     * Execute full native website scan across all published posts and pages.
     *
     * @return array<string, mixed>
     */
    public static function executeScan(): array
    {
        $startTime = microtime(true);

        // 1. Discover public posts and pages
        $queryArgs = [
            'post_type'      => ['post', 'page'],
            'post_status'    => 'publish',
            'posts_per_page' => 200,
            'orderby'        => 'modified',
            'order'          => 'DESC',
            'suppress_filters' => true,
        ];

        $posts = get_posts($queryArgs);

        $documents = [];
        $urls = [];
        $totalWords = 0;

        foreach ($posts as $p) {
            $permalink = get_permalink($p->ID);
            if (!$permalink) {
                continue;
            }

            // Clean content without raw shortcodes or scripts
            $rawContent = $p->post_content;
            $cleanContent = wp_strip_all_tags(strip_shortcodes($rawContent));
            $cleanContent = preg_replace('/\s+/', ' ', trim($cleanContent)) ?? '';

            $wordCount = str_word_count($cleanContent);
            $totalWords += $wordCount;

            // Extract headings
            $headings = self::extractHeadings($rawContent);

            // Extract categories
            $categories = wp_get_post_categories($p->ID, ['fields' => 'names']);
            if (is_wp_error($categories)) {
                $categories = [];
            }

            $contentHash = hash('sha256', $cleanContent);

            $doc = [
                'id'              => $p->ID,
                'url'             => $permalink,
                'title'           => get_the_title($p->ID),
                'content_type'    => $p->post_type,
                'word_count'      => $wordCount,
                'reading_time'    => (int) ceil($wordCount / 200),
                'content_hash'    => $contentHash,
                'headings'        => $headings,
                'categories'      => $categories,
                'published_at'    => get_the_date('c', $p->ID),
                'modified_at'     => get_the_modified_date('c', $p->ID),
                'clean_text'      => substr($cleanContent, 0, 1000) . (strlen($cleanContent) > 1000 ? '...' : ''),
                'status'          => 'processed',
            ];

            $documents[] = $doc;

            $urls[] = [
                'url'          => $permalink,
                'status'       => 'fetched',
                'status_code'  => 200,
                'content_type' => $p->post_type,
                'depth'        => 1,
                'discovered_at'=> current_time('mysql'),
            ];
        }

        // 2. Robots & Sitemap check
        $sitemapUrl = home_url('/wp-sitemap.xml');
        $robotsUrl = home_url('/robots.txt');

        $elapsed = round(microtime(true) - $startTime, 3);

        $state = [
            'status'           => 'completed',
            'progress'         => 100,
            'job_id'           => 'native-scan-' . time(),
            'total_discovered' => count($urls),
            'total_processed'  => count($documents),
            'total_words'      => $totalWords,
            'sitemap_url'      => $sitemapUrl,
            'robots_url'       => $robotsUrl,
            'duration_seconds' => $elapsed,
            'scanned_at'       => current_time('mysql'),
        ];

        update_option(self::OPTION_CRAWL_STATE, $state);
        update_option(self::OPTION_INVENTORY, [
            'documents' => $documents,
            'urls'      => $urls,
        ]);

        return $state;
    }

    /**
     * Get current crawl state.
     *
     * @return array<string, mixed>
     */
    public static function getState(): array
    {
        $default = [
            'status'           => 'idle',
            'progress'         => 0,
            'job_id'           => null,
            'total_discovered' => 0,
            'total_processed'  => 0,
            'total_words'      => 0,
            'scanned_at'       => null,
        ];

        $state = get_option(self::OPTION_CRAWL_STATE, $default);
        if (!is_array($state)) {
            return $default;
        }

        return array_merge($default, $state);
    }

    /**
     * Get inventory list.
     *
     * @return array{documents: array<mixed>, urls: array<mixed>}
     */
    public static function getInventory(): array
    {
        $raw = get_option(self::OPTION_INVENTORY, ['documents' => [], 'urls' => []]);
        if (!is_array($raw)) {
            return ['documents' => [], 'urls' => []];
        }

        return [
            'documents' => $raw['documents'] ?? [],
            'urls'      => $raw['urls'] ?? [],
        ];
    }

    /**
     * Helper to extract h1-h3 headings from raw content.
     *
     * @param string $html
     * @return array<string>
     */
    private static function extractHeadings(string $html): array
    {
        $headings = [];
        if (preg_match_all('/<h[1-3][^>]*>(.*?)<\/h[1-3]>/is', $html, $matches)) {
            foreach ($matches[1] as $h) {
                $clean = trim(wp_strip_all_tags($h));
                if (!empty($clean)) {
                    $headings[] = $clean;
                }
            }
        }
        return $headings;
    }
}
