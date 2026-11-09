<?php
/**
 * BlogNexa AI - Deactivation Lifecycle Manager
 *
 * @package BlogNexaAI\Lifecycle
 */

declare(strict_types=1);

namespace BlogNexaAI\Lifecycle;

use BlogNexaAI\Security\AuditLogger;

if (!defined('ABSPATH')) {
    exit;
}

final class Deactivator
{
    /**
     * Handle plugin deactivation.
     * Preserves all user data, database tables, and settings.
     */
    public static function deactivate(): void
    {
        // 1. Clear scheduled cron hooks if any were registered
        wp_clear_scheduled_hook('blognexa_cron_sync');

        // 2. Clear transients
        delete_transient('blognexa_flush_rewrites');

        // 3. Record audit log
        AuditLogger::log('plugin_deactivation', 'plugin', 'blognexa-ai', [
            'version' => BLOGNEXA_VERSION,
        ]);

        do_action('blognexa_deactivated');
    }
}

