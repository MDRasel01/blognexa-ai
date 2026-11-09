<?php
/**
 * BlogNexa AI - Database Installer
 *
 * @package BlogNexaAI\Database
 */

declare(strict_types=1);

namespace BlogNexaAI\Database;

if (!defined('ABSPATH')) {
    exit;
}

final class Installer
{
    public const DB_VERSION_OPTION = 'blognexa_db_version';
    public const SETTINGS_OPTION = 'blognexa_settings';

    /**
     * Install database tables and initial options.
     */
    public static function install(): void
    {
        if (file_exists(ABSPATH . 'wp-admin/includes/upgrade.php')) {
            require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        }

        $tableQueries = Schema::getTableDefinitions();
        foreach ($tableQueries as $query) {
            dbDelta($query);
        }

        update_option(self::DB_VERSION_OPTION, BLOGNEXA_DB_VERSION);

        // Initialize default options if absent
        if (!get_option(self::SETTINGS_OPTION)) {
            $defaultsFile = BLOGNEXA_CONFIG_PATH . 'defaults.php';
            $defaultConfig = file_exists($defaultsFile) ? require $defaultsFile : [];
            update_option(self::SETTINGS_OPTION, $defaultConfig);
        }
    }
}
