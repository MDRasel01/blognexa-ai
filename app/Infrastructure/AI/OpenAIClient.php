<?php
/**
 * BlogNexa AI - OpenAI Direct Client
 *
 * @package BlogNexaAI\Infrastructure\AI
 */

declare(strict_types=1);

namespace BlogNexaAI\Infrastructure\AI;

use WP_Error;

if (!defined('ABSPATH')) {
    exit;
}

final class OpenAIClient implements AIClientInterface
{
    private const BASE_URL = 'https://api.openai.com/v1/chat/completions';
    public const DEFAULT_MODEL = 'gpt-4o-mini';

    private string $apiKey;
    private string $model;

    public function __construct(string $apiKey, string $model = self::DEFAULT_MODEL)
    {
        $this->apiKey = trim($apiKey);
        $this->model = !empty($model) ? $model : self::DEFAULT_MODEL;
    }

    public function getProviderName(): string
    {
        return 'openai';
    }

    public function getModel(): string
    {
        return $this->model;
    }

    public function testConnection(): array|WP_Error
    {
        $startTime = microtime(true);
        $result = $this->generateText('Respond with one word: OK', [
            'max_tokens'  => 5,
            'temperature' => 0.0,
        ]);

        if (is_wp_error($result)) {
            return $result;
        }

        $latency = (int) round((microtime(true) - $startTime) * 1000);

        return [
            'success'    => true,
            'message'    => 'Successfully connected to OpenAI API.',
            'latency_ms' => $latency,
            'model'      => $this->model,
        ];
    }

    public function generateText(string $prompt, array $options = []): array|WP_Error
    {
        if (empty($this->apiKey)) {
            return new WP_Error('missing_openai_api_key', __('OpenAI API key is not configured.', 'blognexa-ai'));
        }

        $temperature = (float) ($options['temperature'] ?? 0.7);
        $maxTokens = (int) ($options['max_tokens'] ?? 2048);

        $messages = [];
        if (!empty($options['system_instruction'])) {
            $messages[] = [
                'role'    => 'system',
                'content' => (string) $options['system_instruction'],
            ];
        }
        $messages[] = [
            'role'    => 'user',
            'content' => $prompt,
        ];

        $body = [
            'model'       => $this->model,
            'messages'    => $messages,
            'temperature' => $temperature,
            'max_tokens'  => $maxTokens,
        ];

        $response = wp_remote_post(self::BASE_URL, [
            'headers' => [
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $this->apiKey,
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

        if ($statusCode !== 200 || empty($data['choices'][0]['message']['content'])) {
            $errorMsg = $data['error']['message'] ?? ('OpenAI API returned HTTP ' . $statusCode);
            return new WP_Error('openai_api_error', $errorMsg, ['status' => $statusCode, 'data' => $data]);
        }

        $content = (string) $data['choices'][0]['message']['content'];
        $usage = [
            'prompt_tokens'     => (int) ($data['usage']['prompt_tokens'] ?? 0),
            'completion_tokens' => (int) ($data['usage']['completion_tokens'] ?? 0),
            'total_tokens'      => (int) ($data['usage']['total_tokens'] ?? 0),
        ];

        return [
            'content'     => $content,
            'token_usage' => $usage,
            'model'       => $this->model,
        ];
    }

    public function generateStructured(string $prompt, array $schema = [], array $options = []): array|WP_Error
    {
        if (empty($this->apiKey)) {
            return new WP_Error('missing_openai_api_key', __('OpenAI API key is not configured.', 'blognexa-ai'));
        }

        $messages = [];
        $systemMsg = ($options['system_instruction'] ?? '') . "\nYou are a structured data extractor. You must respond in valid JSON.";
        $messages[] = [
            'role'    => 'system',
            'content' => $systemMsg,
        ];
        $messages[] = [
            'role'    => 'user',
            'content' => $prompt,
        ];

        $body = [
            'model'           => $this->model,
            'messages'        => $messages,
            'temperature'     => (float) ($options['temperature'] ?? 0.2),
            'response_format' => ['type' => 'json_object'],
        ];

        $response = wp_remote_post(self::BASE_URL, [
            'headers' => [
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $this->apiKey,
            ],
            'body'    => (string) wp_json_encode($body),
            'timeout' => 45,
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $responseBody = wp_remote_retrieve_body($response);
        $data = json_decode($responseBody, true);

        if (empty($data['choices'][0]['message']['content'])) {
            $errorMsg = $data['error']['message'] ?? 'Failed to receive response from OpenAI.';
            return new WP_Error('openai_structured_error', $errorMsg);
        }

        $rawJson = (string) $data['choices'][0]['message']['content'];
        $parsed = json_decode($rawJson, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return new WP_Error('json_parse_error', 'Invalid JSON from OpenAI: ' . json_last_error_msg());
        }

        return $parsed;
    }
}

