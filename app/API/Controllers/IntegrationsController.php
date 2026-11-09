<?php
/**
 * BlogNexa AI - Integrations & WordPress Environment REST Controller
 *
 * @package BlogNexaAI\API\Controllers
 */

declare(strict_types=1);

namespace BlogNexaAI\API\Controllers;

use BlogNexaAI\API\Responses\ApiResponse;
use BlogNexaAI\Integrations\SEODetector;
use BlogNexaAI\Integrations\PostTypeManager;
use BlogNexaAI\Security\PermissionManager;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if (!defined('ABSPATH')) {
    exit;
}

final class IntegrationsController extends BaseController
{
    public function register_routes(): void
    {
        // GET /wp-json/blognexa/v1/integrations/seo
        register_rest_route(
            $this->namespace,
            '/integrations/seo',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getSEODetection'],
                    'permission_callback' => [PermissionManager::class, 'checkAccess'],
                ],
            ]
        );

        // POST /wp-json/blognexa/v1/integrations/seo/primary
        register_rest_route(
            $this->namespace,
            '/integrations/seo/primary',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'setPrimarySEO'],
                    'permission_callback' => [PermissionManager::class, 'checkManageSettings'],
                ],
            ]
        );

        // GET /wp-json/blognexa/v1/integrations/post-types
        register_rest_route(
            $this->namespace,
            '/integrations/post-types',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getPostTypes'],
                    'permission_callback' => [PermissionManager::class, 'checkAccess'],
                ],
            ]
        );

        // POST /wp-json/blognexa/v1/integrations/post-types
        register_rest_route(
            $this->namespace,
            '/integrations/post-types',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'savePostTypes'],
                    'permission_callback' => [PermissionManager::class, 'checkManageSettings'],
                ],
            ]
        );

        // GET /wp-json/blognexa/v1/integrations/core
        register_rest_route(
            $this->namespace,
            '/integrations/core',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getCoreEngineStatus'],
                    'permission_callback' => [PermissionManager::class, 'checkAccess'],
                ],
            ]
        );
    }

    public function getSEODetection(WP_REST_Request $request): WP_REST_Response
    {
        return ApiResponse::success(SEODetector::detectAll());
    }

    public function setPrimarySEO(WP_REST_Request $request): WP_REST_Response
    {
        $provider = sanitize_text_field((string) $request->get_param('provider'));
        $success = SEODetector::setPrimaryProvider($provider);

        if (!$success) {
            return ApiResponse::error('invalid_provider', __('Unsupported SEO provider.', 'blognexa-ai'), 400);
        }

        return ApiResponse::success(SEODetector::detectAll());
    }

    public function getPostTypes(WP_REST_Request $request): WP_REST_Response
    {
        return ApiResponse::success([
            'post_types'    => PostTypeManager::discoverPostTypes(),
            'enabled_types' => PostTypeManager::getEnabledPostTypes(),
        ]);
    }

    public function savePostTypes(WP_REST_Request $request): WP_REST_Response
    {
        $types = (array) ($request->get_param('enabled_types') ?? []);
        PostTypeManager::setEnabledPostTypes($types);

        return ApiResponse::success([
            'message'       => __('Supported post types updated.', 'blognexa-ai'),
            'post_types'    => PostTypeManager::discoverPostTypes(),
            'enabled_types' => PostTypeManager::getEnabledPostTypes(),
        ]);
    }

    public function getCoreEngineStatus(WP_REST_Request $request): WP_REST_Response
    {
        global $wp_version, $wpdb;

        return ApiResponse::success([
            'engine' => [
                'name'         => 'WordPress Core Engine',
                'status'       => 'operational',
                'status_label' => 'Available',
                'description'  => 'Native WordPress functionality, custom post types, taxonomy, and REST APIs.',
            ],
            'runtime' => [
                'wp_version'      => $wp_version,
                'php_version'     => PHP_VERSION,
                'mysql_version'   => $wpdb->db_version(),
                'rest_available'  => true,
                'rest_namespace'  => BLOGNEXA_REST_NAMESPACE,
                'multisite'       => is_multisite(),
                'memory_limit'    => ini_get('memory_limit'),
                'max_upload_size' => size_format(wp_max_upload_size()),
            ],
        ]);
    }
}
