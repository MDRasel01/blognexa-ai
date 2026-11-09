<?php
/**
 * BlogNexa AI - Abstract Base Module
 *
 * @package BlogNexaAI\Modules
 */

declare(strict_types=1);

namespace BlogNexaAI\Modules;

use BlogNexaAI\Core\ModuleInterface;
use BlogNexaAI\Core\Container;

if (!defined('ABSPATH')) {
    exit;
}

abstract class AbstractModule implements ModuleInterface
{
    protected ?Container $container = null;

    public function register(Container $container): void
    {
        $this->container = $container;
    }

    public function boot(): void
    {
        // Default empty boot hook for modules
    }
}
