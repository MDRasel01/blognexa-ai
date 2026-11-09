<?php
/**
 * BlogNexa AI - Connection Management REST Controller
 *
 * @package BlogNexaAI\API\Controllers
 */

declare(strict_types=1);

namespace BlogNexaAI\API\Controllers;

use BlogNexaAI\API\Responses\ApiResponse;
use BlogNexaAI\Security\ConnectionStateMachine;
use BlogNexaAI\Security\EnrollmentManager;
use BlogNexaAI\Security\PermissionManager;
use BlogNexaAI\Infrastructure\HTTP\WordPressHTTPClient;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if (!defined('ABSPATH')) {
    exit;
}

final class ConnectionController extends BaseController
{
    /**
     * Register endpoints.
     */
    public function register_routes(): void
    {
        // POST /wp-json/blognexa/v1/connection/enroll
        register_rest_route(
            $this->namespace,
            '/connection/enroll',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'enrollSite'],
                    'permission_callback' => [PermissionManager::class, 'checkManageSettings'],
                ],
            ]
        );

        // POST /wp-json/blognexa/v1/connection/disconnect
        register_rest_route(
            $this->namespace,
            '/connection/disconnect',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'disconnectSite'],
                    'permission_callback' => [PermissionManager::class, 'checkManageSettings'],
                ],
            ]
        );

        // POST /wp-json/blognexa/v1/connection/test
        register_rest_route(
            $this->namespace,
            '/connection/test',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'testConnection'],
                    'permission_callback' => [PermissionManager::class, 'checkManageSettings'],
                ],
            ]
        );

        // GET /wp-json/blognexa/v1/connection/diagnostics
        register_rest_route(
            $this->namespace,
            '/connection/diagnostics',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getDiagnostics'],
                    'permission_callback' => [PermissionManager::class, 'checkManageSettings'],
                ],
            ]
        );
    }

    /**
     * Enroll site with cloud backend using one-time enrollment code.
     */
    public function enrollSite(WP_REST_Request $request): WP_REST_Response
    {
        $code = sanitize_text_field((string) $request->get_param('enrollment_code'));
        $backendUrl = esc_url_raw((string) $request->get_param('backend_url'));
        if (empty($backendUrl)) {
            $backendUrl = 'https://api.blognexa.ai';
        }

        if (empty($code)) {
            return ApiResponse::error(
                'missing_enrollment_code',
                __('Enrollment code is required.', 'blognexa-ai'),
                400
            );
        }

        $result = EnrollmentManager::exchangeEnrollmentCode($code, $backendUrl);
        if (is_wp_error($result)) {
            return ApiResponse::error(
                $result->get_error_code(),
                $result->get_error_message(),
                400,
                $result->get_error_data()
            );
        }

        return ApiResponse::success($result);
    }

    /**
     * Disconnect site from cloud backend.
     */
    public function disconnectSite(WP_REST_Request $request): WP_REST_Response
    {
        EnrollmentManager::disconnect();
        return ApiResponse::success([
            'status'  => 'disconnected',
            'message' => __('Successfully disconnected from BlogNexa Cloud.', 'blognexa-ai'),
        ]);
    }

    /**
     * Perform signed health check with cloud backend.
     */
    public function testConnection(WP_REST_Request $request): WP_REST_Response
    {
        $client = new WordPressHTTPClient('https://api.blognexa.ai', 5);
        $res = $client->get('/v1/site/status');

        if (is_wp_error($res)) {
            return ApiResponse::error(
                'connection_test_failed',
                $res->get_error_message(),
                502,
                $res->get_error_data()
            );
        }

        return ApiResponse::success([
            'status'  => 'healthy',
            'backend' => $res,
        ]);
    }

    /**
     * Get detailed connection diagnostics.
     */
    public function getDiagnostics(WP_REST_Request $request): WP_REST_Response
    {
        return ApiResponse::success(ConnectionStateMachine::getDiagnostics());
    }
}

