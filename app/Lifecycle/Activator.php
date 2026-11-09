<?php
/**
 * BlogNexa AI - Activation Lifecycle Manager
 *
 * @package BlogNexaAI\Lifecycle
 */

declare(strict_types=1);

namespace BlogNexaAI\Lifecycle;

use BlogNexaAI\Core\Requirements;
use BlogNexaAI\Database\Installer;
use BlogNexaAI\Database\Migrator;
use BlogNexaAI\Security\CapabilityManager;
use BlogNexaAI\Security\AuditLogger;

if (!defined('ABSPATH')) {
    exit;
}

final class Activator
{
    /**
     * Handle plugin activation.
     */
    public static function activate(): void
    {
        // 1. Verify runtime requirements
        if (!Requirements::check()) {
            deactivate_plugins(plugin_basename(BLOGNEXA_FILE));
            wp_die(
                esc_html__('BlogNexa AI activation failed because server requirements were not met.', 'blognexa-ai'),
                esc_html__('Plugin Activation Error', 'blognexa-ai'),
                ['back_link' => true]
            );
        }

        // 2. Install database tables and initial options
        Installer::install();

        // 3. Run any pending database migrations
        Migrator::checkAndMigrate();

        // 4. Register custom capabilities
        CapabilityManager::registerCapabilities();

        // 5. Audit log activation
        AuditLogger::log('plugin_activation', 'plugin', 'blognexa-ai', [
            'version'    => BLOGNEXA_VERSION,
            'db_version' => BLOGNEXA_DB_VERSION,
        ]);

        // 6. Safe transient flag if rewrites need updating
        set_transient('blognexa_flush_rewrites', 1, 60);

        do_action('blognexa_activated');
    }
}

