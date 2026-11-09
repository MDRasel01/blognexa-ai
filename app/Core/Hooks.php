<?php
/**
 * BlogNexa AI - Hooks Orchestrator
 *
 * @package BlogNexaAI\Core
 */

declare(strict_types=1);

namespace BlogNexaAI\Core;

if (!defined('ABSPATH')) {
    exit;
}

final class Hooks
{
    /**
     * Add action wrapper with strict type safety.
     *
     * @param string $hook
     * @param callable $callback
     * @param int $priority
     * @param int $acceptedArgs
     */
    public static function addAction(string $hook, callable $callback, int $priority = 10, int $acceptedArgs = 1): void
    {
        add_action($hook, $callback, $priority, $acceptedArgs);
    }

    /**
     * Add filter wrapper with strict type safety.
     *
     * @param string $hook
     * @param callable $callback
     * @param int $priority
     * @param int $acceptedArgs
     */
    public static function addFilter(string $hook, callable $callback, int $priority = 10, int $acceptedArgs = 1): void
    {
        add_filter($hook, $callback, $priority, $acceptedArgs);
    }
}

