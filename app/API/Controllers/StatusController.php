<?php
/**
 * BlogNexa AI - System Status REST Controller
 *
 * @package BlogNexaAI\API\Controllers
 */

declare(strict_types=1);

namespace BlogNexaAI\API\Controllers;

use BlogNexaAI\API\Responses\ApiResponse;
use BlogNexaAI\Security\PermissionManager;
use BlogNexaAI\Database\Installer;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if (!defined('ABSPATH')) {
    exit;
}

final class StatusController extends BaseController
{
    /**
     * Register endpoints.
     */
    public function register_routes(): void
    {
        // GET /wp-json/blognexa/v1/status
        register_rest_route(
            $this->namespace,
            '/status',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getStatus'],
                    'permission_callback' => [PermissionManager::class, 'checkAccess'],
                ],
            ]
        );

        // GET /wp-json/blognexa/v1/connection/status
        register_rest_route(
            $this->namespace,
            '/connection/status',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getConnectionStatus'],
                    'permission_callback' => [PermissionManager::class, 'checkAccess'],
                ],
            ]
        );
    }

    /**
     * Get system and environment status.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function getStatus(WP_REST_Request $request): WP_REST_Response
    {
        global $wp_version, $wpdb;

        $dbVersion = get_option(Installer::DB_VERSION_OPTION, '0.0.0');

        $data = [
            'plugin' => [
                'name'       => 'BlogNexa AI',
                'version'    => BLOGNEXA_VERSION,
                'db_version' => $dbVersion,
                'status'     => 'healthy',
            ],
            'environment' => [
                'php_version' => PHP_VERSION,
                'wp_version'  => $wp_version,
                'mysql_version' => $wpdb->db_version(),
            ],
            'timestamp' => current_time('mysql'),
        ];

        return ApiResponse::success($data);
    }

    /**
     * Get cloud backend connection status.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function getConnectionStatus(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;
        $table = $wpdb->prefix . BLOGNEXA_TABLE_CONNECTIONS;

        $connection = $wpdb->get_row(
            "SELECT site_uuid, backend_url, status, last_ping_at, created_at FROM {$table} ORDER BY id DESC LIMIT 1",
            ARRAY_A
        );

        if (!$connection) {
            return ApiResponse::success([
                'connected' => false,
                'status'    => 'disconnected',
                'message'   => __('Site is not connected to BlogNexa Cloud.', 'blognexa-ai'),
            ]);
        }

        return ApiResponse::success([
            'connected'    => $connection['status'] === 'connected',
            'status'       => $connection['status'],
            'site_uuid'    => $connection['site_uuid'],
            'backend_url'  => $connection['backend_url'],
            'last_ping_at' => $connection['last_ping_at'],
        ]);
    }
}

