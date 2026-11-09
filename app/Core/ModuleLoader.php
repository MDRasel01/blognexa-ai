<?php
/**
 * BlogNexa AI - Module Loader
 *
 * @package BlogNexaAI\Core
 */

declare(strict_types=1);

namespace BlogNexaAI\Core;

if (!defined('ABSPATH')) {
    exit;
}

final class ModuleLoader
{
    private Container $container;

    /**
     * Loaded modules list.
     *
     * @var array<string, ModuleInterface>
     */
    private array $modules = [];

    public function __construct(Container $container)
    {
        $this->container = $container;
    }

    /**
     * Initialize all 11 core product modules.
     */
    public function load(): void
    {
        $moduleNamespaces = [
            'Overview',
            'WebsiteIntelligence',
            'KnowledgeBase',
            'ContentStrategy',
            'SEOResearch',
            'BlogStudio',
            'ImageStudio',
            'Publishing',
            'Analytics',
            'Integrations',
            'Settings',
        ];

        foreach ($moduleNamespaces as $ns) {
            $class = "BlogNexaAI\\Modules\\{$ns}\\Module";
            if (class_exists($class)) {
                /** @var ModuleInterface $module */
                $module = new $class();
                $module->register($this->container);
                $this->modules[$module->getId()] = $module;
            }
        }

        // Boot loaded modules
        foreach ($this->modules as $module) {
            $module->boot();
        }
    }

    /**
     * Get loaded module by id.
     *
     * @param string $id
     * @return ModuleInterface|null
     */
    public function getModule(string $id): ?ModuleInterface
    {
        return $this->modules[$id] ?? null;
    }

    /**
     * Get all loaded modules.
     *
     * @return array<string, ModuleInterface>
     */
    public function getModules(): array
    {
        return $this->modules;
    }
}
