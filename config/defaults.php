<?php
/**
 * BlogNexa AI - Configuration Defaults
 *
 * @package BlogNexaAI
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

return [
    'general' => [
        'backend_url'             => 'https://api.blognexa.ai',
        'connection_status'       => 'disconnected',
        'site_uuid'               => '',
        'api_key'                 => '',
        'data_retention_days'     => 90,
        'telemetry_enabled'       => false,
    ],
    'publishing' => [
        'default_status'          => 'draft', // 'draft', 'pending', 'publish', 'scheduled'
        'require_human_approval'  => true,
        'prevent_duplicate_slug'  => true,
        'auto_assign_author_id'   => 0,
        'default_category_id'     => 1,
    ],
    'seo' => [
        'active_provider'         => 'auto_detect', // 'rank_math', 'yoast', 'aioseo', 'native'
        'sync_meta_title'         => true,
        'sync_meta_description'   => true,
        'sync_focus_keyword'      => true,
        'sync_canonical_url'      => true,
    ],
    'editorial' => [
        'brand_voice'             => 'professional_informative',
        'target_audience'         => 'general',
        'default_language'        => 'en_US',
        'min_words'               => 1200,
        'max_words'               => 2500,
        'include_faq'             => true,
        'include_table_of_contents' => true,
    ],
    'crawler' => [
        'max_pages_per_scan'      => 500,
        'crawl_delay_ms'          => 250,
        'respect_robots_txt'      => true,
        'exclude_path_patterns'   => [
            '/wp-admin/*',
            '/wp-login.php',
            '/cart/*',
            '/checkout/*',
            '/account/*',
        ],
    ],
];

