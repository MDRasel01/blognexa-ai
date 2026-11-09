<?php
/**
 * BlogNexa AI - Base REST Controller
 *
 * @package BlogNexaAI\API\Controllers
 */

declare(strict_types=1);

namespace BlogNexaAI\API\Controllers;

use WP_REST_Controller;

if (!defined('ABSPATH')) {
    exit;
}

abstract class BaseController extends WP_REST_Controller
{
    /**
     * Namespace for all BlogNexa REST routes.
     *
     * @var string
     */
    protected $namespace = BLOGNEXA_REST_NAMESPACE;

    /**
     * Register the routes for the controller.
     */
    public function register_routes(): void
    {
        // Concrete controllers override this method
    }
}
