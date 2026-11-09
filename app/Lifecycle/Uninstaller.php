<?php
/**
 * BlogNexa AI - Uninstall Lifecycle Manager
 *
 * @package BlogNexaAI\Lifecycle
 */

declare(strict_types=1);

namespace BlogNexaAI\Lifecycle;

use BlogNexaAI\Security\CapabilityManager;

if (!defined('ABSPATH')) {
    exit;
}

final class Uninstaller
{
    /**
     * Run the uninstall process according to data retention policy.
     */
    public static function uninstall(): void
    {
        // 1. Always revoke custom capabilities on complete uninstall
        CapabilityManager::removeCapabilities();

        // 2. Clear scheduled hooks
        wp_clear_scheduled_hook('blognexa_cron_sync');
        delete_transient('blognexa_flush_rewrites');

        // 3. Check data retention policy
        $settings = get_option('blognexa_settings', []);
        $purgeRequested = !empty($settings['general']['purge_data_on_uninstall']);

        if (!$purgeRequested) {
            // Default safe policy: preserve tables, published posts, and media
            return;
        }

        // 4. Controlled data removal (only BlogNexa-owned assets)
        global $wpdb;

        $tables = [
            $wpdb->prefix . BLOGNEXA_TABLE_CONNECTIONS,
            $wpdb->prefix . BLOGNEXA_TABLE_JOBS,
            $wpdb->prefix . BLOGNEXA_TABLE_PUBLICATIONS,
            $wpdb->prefix . BLOGNEXA_TABLE_AUDIT,
        ];

        foreach ($tables as $table) {
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
            $wpdb->query("DROP TABLE IF EXISTS {$table}");
        }

        // Delete BlogNexa-owned options
        delete_option('blognexa_db_version');
        delete_option('blognexa_settings');
    }
}

