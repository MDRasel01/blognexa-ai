<?php
/**
 * BlogNexa AI - Direct AI Provider Client Interface
 *
 * @package BlogNexaAI\Infrastructure\AI
 */

declare(strict_types=1);

namespace BlogNexaAI\Infrastructure\AI;

use WP_Error;

if (!defined('ABSPATH')) {
    exit;
}

interface AIClientInterface
{
    /**
     * Get the provider identifier (e.g. 'gemini', 'openai', 'claude').
     */
    public function getProviderName(): string;

    /**
     * Get the default/active model identifier.
     */
    public function getModel(): string;

    /**
     * Test connection/credentials with the provider.
     *
     * @return array{success: bool, message: string, latency_ms: int, model: string}|WP_Error
     */
    public function testConnection(): array|WP_Error;

    /**
     * Generate text from a prompt.
     *
     * @param string $prompt
     * @param array<string, mixed> $options
     * @return array{content: string, token_usage: array<string, int>, model: string}|WP_Error
     */
    public function generateText(string $prompt, array $options = []): array|WP_Error;

    /**
     * Generate structured JSON output conforming to a schema.
     *
     * @param string $prompt
     * @param array<string, mixed> $schema
     * @param array<string, mixed> $options
     * @return array<string, mixed>|WP_Error
     */
    public function generateStructured(string $prompt, array $schema = [], array $options = []): array|WP_Error;
}
