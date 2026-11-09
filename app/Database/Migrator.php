<?php
/**
 * BlogNexa AI - Database Migrator
 *
 * @package BlogNexaAI\Database
 */

declare(strict_types=1);

namespace BlogNexaAI\Database;

if (!defined('ABSPATH')) {
    exit;
}

final class Migrator
{
    /**
     * Run any pending database migrations.
     */
    public static function checkAndMigrate(): void
    {
        $installedVersion = get_option(Installer::DB_VERSION_OPTION, '0.0.0');

        if (version_compare((string) $installedVersion, BLOGNEXA_DB_VERSION, '<')) {
            self::migrate($installedVersion);
        }
    }

    /**
     * Sequential version migrations.
     *
     * @param string $installedVersion
     */
    private static function migrate(string $installedVersion): void
    {
        // Re-run dbDelta for structural updates
        Installer::install();
    }
}

