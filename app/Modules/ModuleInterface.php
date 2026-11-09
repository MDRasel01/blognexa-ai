<?php
/**
 * BlogNexa AI - Module Contract
 *
 * @package BlogNexaAI\Modules
 */

declare(strict_types=1);

namespace BlogNexaAI\Modules;

use BlogNexaAI\Core\Container;

if (!defined('ABSPATH')) {
    exit;
}

interface ModuleInterface
{
    /**
     * Get unique module identifier.
     *
     * @return string
     */
    public function getId(): string;

    /**
     * Get module title/name.
     *
     * @return string
     */
    public function getName(): string;

    /**
     * Register module services into the container.
     *
     * @param Container $container
     */
    public function register(Container $container): void;

    /**
     * Boot module runtime hooks and listeners.
     */
    public function boot(): void;
}

