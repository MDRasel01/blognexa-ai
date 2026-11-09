<?php
/**
 * BlogNexa AI - Main Application Orchestrator
 *
 * @package BlogNexaAI\Core
 */

declare(strict_types=1);

namespace BlogNexaAI\Core;

use BlogNexaAI\Admin\AdminMenu;
use BlogNexaAI\Admin\AdminAssets;
use BlogNexaAI\Admin\AdminNotices;
use BlogNexaAI\API\RESTRegistrar;
use BlogNexaAI\Database\Migrator;

if (!defined('ABSPATH')) {
    exit;
}

final class Plugin
{
    /**
     * Singleton instance.
     *
     * @var self|null
     */
    private static ?self $instance = null;

    /**
     * Dependency container.
     *
     * @var Container
     */
    private Container $container;

    /**
     * Module loader.
     *
     * @var ModuleLoader
     */
    private ModuleLoader $moduleLoader;

    /**
     * Get singleton instance.
     *
     * @return self
     */
    public static function instance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
        $this->container = new Container();
        $this->container->instance(Container::class, $this->container);
        $this->container->instance(self::class, $this);

        $this->moduleLoader = new ModuleLoader($this->container);
        $this->container->instance(ModuleLoader::class, $this->moduleLoader);
    }

    /**
     * Boot plugin services and hooks.
     */
    public function boot(): void
    {
        // 1. Check for pending database migrations on admin init
        if (is_admin()) {
            add_action('admin_init', [Migrator::class, 'checkAndMigrate']);
        }

        // 2. Initialize Admin UI if in WordPress Admin
        if (is_admin() || (defined('DOING_AJAX') && DOING_AJAX)) {
            $adminMenu = new AdminMenu();
            $adminMenu->register();

            $adminAssets = new AdminAssets();
            $adminAssets->register();

            $adminNotices = new AdminNotices();
            $adminNotices->register();
        }

        // 3. Initialize REST API Registrar
        $restRegistrar = new RESTRegistrar();
        $restRegistrar->register();

        // 4. Boot Feature Modules
        $this->moduleLoader->load();

        // 5. Trigger loaded hook for third-party extensions
        do_action('blognexa_loaded', $this);
    }

    /**
     * Get the container instance.
     *
     * @return Container
     */
    public function getContainer(): Container
    {
        return $this->container;
    }

    /**
     * Get the module loader instance.
     *
     * @return ModuleLoader
     */
    public function getModuleLoader(): ModuleLoader
    {
        return $this->moduleLoader;
    }
}
