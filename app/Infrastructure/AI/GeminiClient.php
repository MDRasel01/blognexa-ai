<?php
/**
 * BlogNexa AI - Google Gemini Direct Client
 *
 * @package BlogNexaAI\Infrastructure\AI
 */

declare(strict_types=1);

namespace BlogNexaAI\Infrastructure\AI;

use WP_Error;

if (!defined('ABSPATH')) {
    exit;
}

final class GeminiClient implements AIClientInterface
{
    private const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
    public const DEFAULT_MODEL = 'gemini-1.5-flash';

    private string $apiKey;
    private string $model;

    public function __construct(string $apiKey, string $model = self::DEFAULT_MODEL)
    {
        $this->apiKey = trim($apiKey);
        $this->model = !empty($model) ? $model : self::DEFAULT_MODEL;
    }

    public function getProviderName(): string
    {
        return 'gemini';
    }

    public function getModel(): string
    {
        return $this->model;
    }

    public function testConnection(): array|WP_Error
    {
        $startTime = microtime(true);
        $result = $this->generateText('Respond with exactly one word: OK', [
            'max_tokens'  => 10,
            'temperature' => 0.0,
        ]);

        if (is_wp_error($result)) {
            return $result;
        }

        $latency = (int) round((microtime(true) - $startTime) * 1000);

        return [
            'success'    => true,
            'message'    => 'Successfully connected to Google Gemini API.',
            'latency_ms' => $latency,
            'model'      => $this->model,
        ];
    }

    public function generateText(string $prompt, array $options = []): array|WP_Error
    {
        if (empty($this->apiKey)) {
            return new WP_Error('missing_gemini_api_key', __('Google Gemini API key is not configured.', 'blognexa-ai'));
        }

        $temperature = (float) ($options['temperature'] ?? 0.7);
        $maxTokens = (int) ($options['max_tokens'] ?? 2048);

        $url = self::BASE_URL . $this->model . ':generateContent?key=' . rawurlencode($this->apiKey);

        $body = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt],
                    ],
                ],
            ],
            'generationConfig' => [
                'temperature'     => $temperature,
                'maxOutputTokens' => $maxTokens,
            ],
        ];

        if (!empty($options['system_instruction'])) {
            $body['systemInstruction'] = [
                'parts' => [
                    ['text' => (string) $options['system_instruction']],
                ],
            ];
        }

        $response = wp_remote_post($url, [
            'headers' => [
                'Content-Type' => 'application/json',
            ],
            'body'    => (string) wp_json_encode($body),
            'timeout' => 45,
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $statusCode = wp_remote_retrieve_response_code($response);
        $responseBody = wp_remote_retrieve_body($response);
        $data = json_decode($responseBody, true);

        if ($statusCode !== 200 || empty($data['candidates'][0]['content']['parts'][0]['text'])) {
            $errorMsg = $data['error']['message'] ?? ('Google Gemini API returned HTTP ' . $statusCode);
            return new WP_Error('gemini_api_error', $errorMsg, ['status' => $statusCode, 'data' => $data]);
        }

        $content = (string) $data['candidates'][0]['content']['parts'][0]['text'];
        $usage = [
            'prompt_tokens'     => (int) ($data['usageMetadata']['promptTokenCount'] ?? 0),
            'completion_tokens' => (int) ($data['usageMetadata']['candidatesTokenCount'] ?? 0),
            'total_tokens'      => (int) ($data['usageMetadata']['totalTokenCount'] ?? 0),
        ];

        return [
            'content'     => $content,
            'token_usage' => $usage,
            'model'       => $this->model,
        ];
    }

    public function generateStructured(string $prompt, array $schema = [], array $options = []): array|WP_Error
    {
        $options['system_instruction'] = ($options['system_instruction'] ?? '') . "\nAlways respond with valid JSON matching the requested structure. Do not wrap in markdown quotes.";

        $url = self::BASE_URL . $this->model . ':generateContent?key=' . rawurlencode($this->apiKey);

        $body = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt],
                    ],
                ],
            ],
            'generationConfig' => [
                'temperature'       => (float) ($options['temperature'] ?? 0.2),
                'maxOutputTokens'   => (int) ($options['max_tokens'] ?? 4096),
                'responseMimeType'  => 'application/json',
            ],
        ];

        $response = wp_remote_post($url, [
            'headers' => [
                'Content-Type' => 'application/json',
            ],
            'body'    => (string) wp_json_encode($body),
            'timeout' => 45,
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $responseBody = wp_remote_retrieve_body($response);
        $data = json_decode($responseBody, true);

        if (empty($data['candidates'][0]['content']['parts'][0]['text'])) {
            $errorMsg = $data['error']['message'] ?? 'Failed to receive structured response from Gemini.';
            return new WP_Error('gemini_structured_error', $errorMsg);
        }

        $rawJson = (string) $data['candidates'][0]['content']['parts'][0]['text'];
        $cleanJson = trim(preg_replace('/^```(?:json)?\s*|\s*```$/m', '', $rawJson) ?? '');
        $parsed = json_decode($cleanJson, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return new WP_Error('json_parse_error', 'Invalid JSON from Gemini: ' . json_last_error_msg(), ['raw' => $rawJson]);
        }

        return $parsed;
    }
}

