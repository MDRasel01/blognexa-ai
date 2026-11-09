<?php
/**
 * BlogNexa AI - Settings REST Controller
 *
 * @package BlogNexaAI\API\Controllers
 */

declare(strict_types=1);

namespace BlogNexaAI\API\Controllers;

use BlogNexaAI\API\Responses\APIResponse;
use BlogNexaAI\Security\PermissionManager;
use BlogNexaAI\Security\AuditLogger;
use BlogNexaAI\Database\Installer;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;

if (!defined('ABSPATH')) {
    exit;
}

final class SettingsController extends BaseController
{
    /**
     * Allowed settings whitelist with validation types and constraints.
     *
     * @var array<string, array{type: string, allowed?: array<string>, min?: int, max?: int}>
     */
    private const ALLOWED_SETTINGS = [
        'writing_language' => [
            'type'    => 'string',
            'allowed' => ['en_US', 'en_GB', 'bn_BD', 'es_ES', 'fr_FR', 'de_DE'],
        ],
        'default_content_type' => [
            'type'    => 'string',
            'allowed' => ['post', 'page'],
        ],
        'default_approval_mode' => [
            'type'    => 'string',
            'allowed' => ['manual', 'auto'],
        ],
        'content_quality_threshold' => [
            'type' => 'integer',
            'min'  => 50,
            'max'  => 100,
        ],
        'brand_voice' => [
            'type'    => 'string',
            'allowed' => ['professional_informative', 'conversational', 'authoritative', 'friendly'],
        ],
        'backend_url' => [
            'type' => 'url',
        ],
        'data_retention_days' => [
            'type' => 'integer',
            'min'  => 7,
            'max'  => 365,
        ],
        'purge_data_on_uninstall' => [
            'type' => 'boolean',
        ],
    ];

    /**
     * Register settings routes.
     */
    public function register_routes(): void
    {
        // GET /wp-json/blognexa/v1/settings
        register_rest_route(
            $this->namespace,
            '/settings',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getSettings'],
                    'permission_callback' => [PermissionManager::class, 'checkManageSettings'],
                ],
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'updateSettings'],
                    'permission_callback' => [PermissionManager::class, 'checkManageSettings'],
                ],
            ]
        );
    }

    /**
     * Get settings without exposing sensitive credentials.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function getSettings(WP_REST_Request $request): WP_REST_Response
    {
        $rawSettings = get_option(Installer::SETTINGS_OPTION, []);
        if (!is_array($rawSettings)) {
            $rawSettings = [];
        }

        $safeSettings = [];
        foreach (self::ALLOWED_SETTINGS as $key => $rule) {
            $safeSettings[$key] = $rawSettings[$key] ?? $this->getDefaultValue($key);
        }

        return APIResponse::success($safeSettings);
    }

    /**
     * Update settings strictly against the whitelist.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function updateSettings(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $params = $request->get_json_params();
        if (!is_array($params)) {
            return APIResponse::error('blognexa_invalid_payload', __('Invalid JSON payload.', 'blognexa-ai'), 400);
        }

        // Reject any unknown setting (Strict Whitelist enforcement)
        foreach (array_keys($params) as $key) {
            if (!isset(self::ALLOWED_SETTINGS[$key])) {
                return APIResponse::error(
                    'blognexa_unknown_setting',
                    sprintf(__('Unknown or unpermitted setting field: [%s]', 'blognexa-ai'), esc_html($key)),
                    400
                );
            }
        }

        $currentSettings = get_option(Installer::SETTINGS_OPTION, []);
        if (!is_array($currentSettings)) {
            $currentSettings = [];
        }

        $validatedUpdates = [];
        foreach ($params as $key => $value) {
            $rule = self::ALLOWED_SETTINGS[$key];

            // Type and constraint validation
            switch ($rule['type']) {
                case 'string':
                    if (!is_string($value)) {
                        return APIResponse::error('blognexa_invalid_type', sprintf(__('Field [%s] must be a string.', 'blognexa-ai'), $key), 400);
                    }
                    $cleanVal = sanitize_text_field($value);
                    if (isset($rule['allowed']) && !in_array($cleanVal, $rule['allowed'], true)) {
                        return APIResponse::error('blognexa_invalid_value', sprintf(__('Invalid value for [%s].', 'blognexa-ai'), $key), 400);
                    }
                    $validatedUpdates[$key] = $cleanVal;
                    break;

                case 'integer':
                    if (!is_numeric($value)) {
                        return APIResponse::error('blognexa_invalid_type', sprintf(__('Field [%s] must be an integer.', 'blognexa-ai'), $key), 400);
                    }
                    $intVal = (int) $value;
                    if (isset($rule['min']) && $intVal < $rule['min']) {
                        return APIResponse::error('blognexa_out_of_range', sprintf(__('Field [%s] minimum value is %d.', 'blognexa-ai'), $key, $rule['min']), 400);
                    }
                    if (isset($rule['max']) && $intVal > $rule['max']) {
                        return APIResponse::error('blognexa_out_of_range', sprintf(__('Field [%s] maximum value is %d.', 'blognexa-ai'), $key, $rule['max']), 400);
                    }
                    $validatedUpdates[$key] = $intVal;
                    break;

                case 'boolean':
                    $validatedUpdates[$key] = (bool) $value;
                    break;

                case 'url':
                    $cleanUrl = esc_url_raw((string) $value);
                    if (!filter_var($cleanUrl, FILTER_VALIDATE_URL)) {
                        return APIResponse::error('blognexa_invalid_url', sprintf(__('Field [%s] must be a valid URL.', 'blognexa-ai'), $key), 400);
                    }
                    $validatedUpdates[$key] = $cleanUrl;
                    break;
            }
        }

        $updatedSettings = array_merge($currentSettings, $validatedUpdates);
        update_option(Installer::SETTINGS_OPTION, $updatedSettings);

        // Audit log settings change
        AuditLogger::log('settings_updated', 'settings', 'global', [
            'updated_keys' => array_keys($validatedUpdates),
        ]);

        return APIResponse::success($validatedUpdates, 200, ['message' => __('Settings successfully saved.', 'blognexa-ai')]);
    }

    /**
     * Default fallbacks for whitelisted settings.
     *
     * @param string $key
     * @return mixed
     */
    private function getDefaultValue(string $key): mixed
    {
        $defaults = [
            'writing_language'          => 'en_US',
            'default_content_type'      => 'post',
            'default_approval_mode'     => 'manual',
            'content_quality_threshold' => 80,
            'brand_voice'               => 'professional_informative',
            'backend_url'               => 'https://api.blognexa.ai',
            'data_retention_days'       => 90,
            'purge_data_on_uninstall'   => false,
        ];

        return $defaults[$key] ?? null;
    }
}

