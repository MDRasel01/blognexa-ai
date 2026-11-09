<?php
/**
 * BlogNexa AI - Logger Interface
 *
 * @package BlogNexaAI\Infrastructure\Logging
 */

declare(strict_types=1);

namespace BlogNexaAI\Infrastructure\Logging;

if (!defined('ABSPATH')) {
    exit;
}

interface LoggerInterface
{
    /**
     * Log a message in a specific category.
     *
     * @param string $category e.g. 'security_event', 'plugin_boot', 'permission_denied'
     * @param string $message
     * @param array<string, mixed> $context
     */
    public function log(string $category, string $message, array $context = []): void;
}

