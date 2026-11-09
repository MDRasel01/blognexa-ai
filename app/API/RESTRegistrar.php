<?php
/**
 * BlogNexa AI - REST API Registrar
 *
 * @package BlogNexaAI\API
 */

declare(strict_types=1);

namespace BlogNexaAI\API;

use BlogNexaAI\API\Controllers\StatusController;
use BlogNexaAI\API\Controllers\SettingsController;
use BlogNexaAI\API\Controllers\ConnectionController;

if (!defined('ABSPATH')) {
    exit;
}

final class RESTRegistrar
{
    /**
     * Register REST API routes.
     */
    public function register(): void
    {
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    /**
     * Instantiate and register controllers.
     */
    public function registerRoutes(): void
    {
        $controllers = [
            new StatusController(),
            new SettingsController(),
            new ConnectionController(),
        ];

        foreach ($controllers as $controller) {
            $controller->register_routes();
        }
    }
}
