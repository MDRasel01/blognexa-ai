<?php
/**
 * BlogNexa AI - AI Provider Factory
 *
 * @package BlogNexaAI\Infrastructure\AI
 */

declare(strict_types=1);

namespace BlogNexaAI\Infrastructure\AI;

use BlogNexaAI\Security\CredentialStore;
use WP_Error;

if (!defined('ABSPATH')) {
    exit;
}

final class AIFactory
{
    public const OPTION_AI_CONFIG = 'blognexa_ai_config';

    /**
     * Get active AI client instance.
     *
     * @return AIClientInterface|WP_Error
     */
    public static function getClient(?string $preferredProvider = null): AIClientInterface|WP_Error
    {
        $config = self::getConfig();
        $provider = $preferredProvider ?? ($config['provider'] ?? 'gemini');

        switch ($provider) {
            case 'openai':
                $key = $config['openai_api_key'] ?? '';
                $model = $config['openai_model'] ?? OpenAIClient::DEFAULT_MODEL;
                if (empty($key)) {
                    return new WP_Error('missing_key', __('OpenAI API key is not configured.', 'blognexa-ai'));
                }
                return new OpenAIClient($key, $model);

            case 'gemini':
            default:
                $key = $config['gemini_api_key'] ?? '';
                $model = $config['gemini_model'] ?? GeminiClient::DEFAULT_MODEL;
                if (empty($key)) {
                    return new WP_Error('missing_key', __('Google Gemini API key is not configured.', 'blognexa-ai'));
                }
                return new GeminiClient($key, $model);
        }
    }

    /**
     * Get saved AI configuration.
     *
     * @return array<string, mixed>
     */
    public static function getConfig(): array
    {
        $raw = get_option(self::OPTION_AI_CONFIG, []);
        if (!is_array($raw)) {
            $raw = [];
        }

        $defaults = [
            'provider'         => 'gemini',
            'gemini_model'     => GeminiClient::DEFAULT_MODEL,
            'gemini_api_key'   => '',
            'openai_model'     => OpenAIClient::DEFAULT_MODEL,
            'openai_api_key'   => '',
            'is_configured'    => false,
            'last_tested_at'   => null,
            'last_test_status' => null,
        ];

        $merged = array_merge($defaults, $raw);
        $merged['is_configured'] = !empty($merged['gemini_api_key']) || !empty($merged['openai_api_key']);

        return $merged;
    }

    /**
     * Save AI configuration.
     *
     * @param array<string, mixed> $newConfig
     * @return bool
     */
    public static function saveConfig(array $newConfig): bool
    {
        $current = self::getConfig();

        if (isset($newConfig['provider'])) {
            $current['provider'] = sanitize_text_field((string) $newConfig['provider']);
        }
        if (isset($newConfig['gemini_model'])) {
            $current['gemini_model'] = sanitize_text_field((string) $newConfig['gemini_model']);
        }
        if (isset($newConfig['gemini_api_key'])) {
            $val = trim((string) $newConfig['gemini_api_key']);
            // Don't overwrite with masked string
            if (!str_contains($val, '••••')) {
                $current['gemini_api_key'] = sanitize_text_field($val);
            }
        }
        if (isset($newConfig['openai_model'])) {
            $current['openai_model'] = sanitize_text_field((string) $newConfig['openai_model']);
        }
        if (isset($newConfig['openai_api_key'])) {
            $val = trim((string) $newConfig['openai_api_key']);
            if (!str_contains($val, '••••')) {
                $current['openai_api_key'] = sanitize_text_field($val);
            }
        }
        if (isset($newConfig['last_tested_at'])) {
            $current['last_tested_at'] = $newConfig['last_tested_at'];
        }
        if (isset($newConfig['last_test_status'])) {
            $current['last_test_status'] = $newConfig['last_test_status'];
        }

        return update_option(self::OPTION_AI_CONFIG, $current);
    }

    /**
     * Get masked configuration safe for browser/REST serialization.
     *
     * @return array<string, mixed>
     */
    public static function getPublicConfig(): array
    {
        $config = self::getConfig();

        $maskKey = static function (string $key): string {
            if (empty($key)) return '';
            $len = strlen($key);
            if ($len <= 8) return '••••••••';
            return substr($key, 0, 4) . '••••••••' . substr($key, -4);
        };

        return [
            'provider'         => $config['provider'],
            'gemini_model'     => $config['gemini_model'],
            'gemini_api_key'   => $maskKey($config['gemini_api_key']),
            'has_gemini_key'   => !empty($config['gemini_api_key']),
            'openai_model'     => $config['openai_model'],
            'openai_api_key'   => $maskKey($config['openai_api_key']),
            'has_openai_key'   => !empty($config['openai_api_key']),
            'is_configured'    => $config['is_configured'],
            'last_tested_at'   => $config['last_tested_at'],
            'last_test_status' => $config['last_test_status'],
        ];
    }
}
