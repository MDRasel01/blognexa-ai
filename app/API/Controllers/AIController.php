<?php
/**
 * BlogNexa AI - Direct AI Controller
 *
 * @package BlogNexaAI\API\Controllers
 */

declare(strict_types=1);

namespace BlogNexaAI\API\Controllers;

use BlogNexaAI\API\Responses\ApiResponse;
use BlogNexaAI\Infrastructure\AI\AIFactory;
use BlogNexaAI\Infrastructure\AI\GeminiClient;
use BlogNexaAI\Infrastructure\AI\OpenAIClient;
use BlogNexaAI\Security\PermissionManager;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if (!defined('ABSPATH')) {
    exit;
}

final class AIController extends BaseController
{
    public function register_routes(): void
    {
        // GET /wp-json/blognexa/v1/ai/config
        register_rest_route(
            $this->namespace,
            '/ai/config',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getConfig'],
                    'permission_callback' => [PermissionManager::class, 'checkManageSettings'],
                ],
            ]
        );

        // POST /wp-json/blognexa/v1/ai/config
        register_rest_route(
            $this->namespace,
            '/ai/config',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'saveConfig'],
                    'permission_callback' => [PermissionManager::class, 'checkManageSettings'],
                ],
            ]
        );

        // POST /wp-json/blognexa/v1/ai/test
        register_rest_route(
            $this->namespace,
            '/ai/test',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'testConnection'],
                    'permission_callback' => [PermissionManager::class, 'checkManageSettings'],
                ],
            ]
        );
    }

    public function getConfig(WP_REST_Request $request): WP_REST_Response
    {
        return ApiResponse::success(AIFactory::getPublicConfig());
    }

    public function saveConfig(WP_REST_Request $request): WP_REST_Response
    {
        $params = $request->get_json_params() ?? [];

        AIFactory::saveConfig($params);

        return ApiResponse::success([
            'message' => __('AI configuration saved successfully.', 'blognexa-ai'),
            'config'  => AIFactory::getPublicConfig(),
        ]);
    }

    public function testConnection(WP_REST_Request $request): WP_REST_Response
    {
        $params = $request->get_json_params() ?? [];
        $provider = !empty($params['provider']) ? sanitize_text_field((string) $params['provider']) : null;
        $tempKey = !empty($params['api_key']) ? trim((string) $params['api_key']) : null;
        $model = !empty($params['model']) ? sanitize_text_field((string) $params['model']) : null;

        if ($tempKey && !str_contains($tempKey, '••••')) {
            if ($provider === 'openai') {
                $client = new OpenAIClient($tempKey, $model ?? OpenAIClient::DEFAULT_MODEL);
            } else {
                $client = new GeminiClient($tempKey, $model ?? GeminiClient::DEFAULT_MODEL);
            }
        } else {
            $client = AIFactory::getClient($provider);
            if (is_wp_error($client)) {
                return ApiResponse::error($client->get_error_code(), $client->get_error_message(), 400);
            }
        }

        $result = $client->testConnection();
        if (is_wp_error($result)) {
            AIFactory::saveConfig(['last_test_status' => 'failed', 'last_tested_at' => current_time('mysql')]);
            return ApiResponse::error($result->get_error_code(), $result->get_error_message(), 502);
        }

        AIFactory::saveConfig([
            'last_test_status' => 'healthy',
            'last_tested_at'   => current_time('mysql'),
        ]);

        return ApiResponse::success($result);
    }
}

