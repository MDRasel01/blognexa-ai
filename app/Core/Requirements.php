<?php
/**
 * BlogNexa AI - Environment Requirements Checker
 *
 * @package BlogNexaAI\Core
 */

declare(strict_types=1);

namespace BlogNexaAI\Core;

if (!defined('ABSPATH')) {
    exit;
}

final class Requirements
{
    /**
     * Required PHP extensions.
     *
     * @var array<string>
     */
    private const REQUIRED_EXTENSIONS = [
        'curl',
        'json',
        'mbstring',
        'openssl',
    ];

    /**
     * Check if the hosting environment meets all requirements.
     *
     * @return bool
     */
    public static function check(): bool
    {
        return empty(self::getFailures());
    }

    /**
     * Get list of unmet requirements.
     *
     * @return array<string>
     */
    public static function getFailures(): array
    {
        global $wp_version;
        $failures = [];

        // Check PHP Version
        if (version_compare(PHP_VERSION, BLOGNEXA_MIN_PHP_VERSION, '<')) {
            $failures[] = sprintf(
                /* translators: 1: Current PHP version, 2: Required PHP version */
                __('BlogNexa AI requires PHP %2$s or higher. Your server is running PHP %1$s.', 'blognexa-ai'),
                PHP_VERSION,
                BLOGNEXA_MIN_PHP_VERSION
            );
        }

        // Check WordPress Version
        if (isset($wp_version) && version_compare($wp_version, BLOGNEXA_MIN_WP_VERSION, '<')) {
            $failures[] = sprintf(
                /* translators: 1: Current WP version, 2: Required WP version */
                __('BlogNexa AI requires WordPress %2$s or higher. Your site is running WordPress %1$s.', 'blognexa-ai'),
                $wp_version,
                BLOGNEXA_MIN_WP_VERSION
            );
        }

        // Check Required Extensions
        foreach (self::REQUIRED_EXTENSIONS as $ext) {
            if (!extension_loaded($ext)) {
                $failures[] = sprintf(
                    /* translators: %s: PHP extension name */
                    __('BlogNexa AI requires the PHP "%s" extension to be installed and enabled.', 'blognexa-ai'),
                    $ext
                );
            }
        }

        return $failures;
    }

    /**
     * Render admin notice when requirements are not met.
     */
    public static function renderNotice(): void
    {
        $failures = self::getFailures();
        if (empty($failures)) {
            return;
        }

        echo '<div class="notice notice-error"><p><strong>' . esc_html__('BlogNexa AI cannot be activated:', 'blognexa-ai') . '</strong></p><ul>';
        foreach ($failures as $failure) {
            echo '<li>' . esc_html($failure) . '</li>';
        }
        echo '</ul></div>';
    }
}

