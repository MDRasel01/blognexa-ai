<?php
/**
 * BlogNexa AI - Backend Client Interface
 *
 * @package BlogNexaAI\Infrastructure\HTTP
 */

declare(strict_types=1);

namespace BlogNexaAI\Infrastructure\HTTP;

use WP_Error;

if (!defined('ABSPATH')) {
    exit;
}

interface BackendClientInterface
{
    /**
     * Send GET request to cloud backend.
     *
     * @param string $endpoint Relative endpoint path (e.g. '/v1/handshake')
     * @param array<string, mixed> $headers
     * @return array<string, mixed>|WP_Error
     */
    public function get(string $endpoint, array $headers = []): array|WP_Error;

    /**
     * Send POST request to cloud backend.
     *
     * @param string $endpoint Relative endpoint path
     * @param array<string, mixed> $body
     * @param array<string, mixed> $headers
     * @return array<string, mixed>|WP_Error
     */
    public function post(string $endpoint, array $body = [], array $headers = []): array|WP_Error;
}

