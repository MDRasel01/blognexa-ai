<?php
/**
 * BlogNexa AI - Module Interface Contract
 *
 * @package BlogNexaAI\Core
 */

declare(strict_types=1);

namespace BlogNexaAI\Core;

if (!defined('ABSPATH')) {
    exit;
}

interface ModuleInterface
{
    /**
     * Get unique module slug identifier.
     *
     * @return string
     */
    public function getId(): string;

    /**
     * Get human-readable module title.
     *
     * @return string
     */
    public function getName(): string;

    /**
     * Register module services and bindings.
     *
     * @param Container $container
     */
    public function register(Container $container): void;

    /**
     * Boot module runtime hooks.
     */
    public function boot(): void;
}

