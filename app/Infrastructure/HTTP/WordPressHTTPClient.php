<?php
/**
 * BlogNexa AI - WordPress HTTP Client with SSRF Guard
 *
 * @package BlogNexaAI\Infrastructure\HTTP
 */

declare(strict_types=1);

namespace BlogNexaAI\Infrastructure\HTTP;

use BlogNexaAI\Security\SecretManager;
use WP_Error;

if (!defined('ABSPATH')) {
    exit;
}

final class WordPressHTTPClient implements BackendClientInterface
{
    private string $baseUrl;
    private int $timeout;

    public function __construct(string $baseUrl = 'https://api.blognexa.ai', int $timeout = 20)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->timeout = $timeout;
    }

    /**
     * Send GET request.
     */
    public function get(string $endpoint, array $headers = []): array|WP_Error
    {
        return $this->request('GET', $endpoint, [], $headers);
    }

    /**
     * Send POST request.
     */
    public function post(string $endpoint, array $body = [], array $headers = []): array|WP_Error
    {
        return $this->request('POST', $endpoint, $body, $headers);
    }

    /**
     * Internal secure request execution.
     */
    private function request(string $method, string $endpoint, array $body = [], array $headers = []): array|WP_Error
    {
        $fullUrl = $this->baseUrl . '/' . ltrim($endpoint, '/');

        // SSRF Guard: Validate destination before network egress
        $ssrfCheck = $this->validateDestinationUrl($fullUrl);
        if (is_wp_error($ssrfCheck)) {
            return $ssrfCheck;
        }

        $defaultHeaders = [
            'Content-Type' => 'application/json',
            'Accept'       => 'application/json',
            'User-Agent'   => 'BlogNexa-AI-Plugin/' . BLOGNEXA_VERSION,
        ];

        $args = [
            'method'      => $method,
            'timeout'     => $this->timeout,
            'redirection' => 2,
            'httpversion' => '1.1',
            'headers'     => array_merge($defaultHeaders, $headers),
            'sslverify'   => true,
        ];

        if ($method === 'POST' && !empty($body)) {
            $args['body'] = wp_json_encode($body);
        }

        $response = wp_remote_request($fullUrl, $args);

        if (is_wp_error($response)) {
            return new WP_Error(
                'blognexa_http_failure',
                __('Failed to communicate with cloud backend.', 'blognexa-ai'),
                ['error' => $response->get_error_message()]
            );
        }

        $statusCode = wp_remote_retrieve_response_code($response);
        $rawBody = wp_remote_retrieve_body($response);
        $data = json_decode($rawBody, true);

        if ($statusCode >= 400) {
            $errorMessage = is_array($data) && isset($data['message']) ? $data['message'] : __('Backend returned an error.', 'blognexa-ai');
            return new WP_Error('blognexa_backend_error', $errorMessage, ['status' => $statusCode, 'data' => $data]);
        }

        return is_array($data) ? $data : ['raw' => $rawBody];
    }

    /**
     * Defense against SSRF: Verify destination is not loopback, private, or cloud metadata.
     */
    public function validateDestinationUrl(string $url): true|WP_Error
    {
        $parts = wp_parse_url($url);
        if (!$parts || empty($parts['host'])) {
            return new WP_Error('blognexa_ssrf_invalid_url', __('Invalid destination URL.', 'blognexa-ai'));
        }

        $scheme = strtolower($parts['scheme'] ?? '');
        if ($scheme !== 'https') {
            return new WP_Error('blognexa_ssrf_insecure_scheme', __('Only HTTPS connections to cloud backend are permitted.', 'blognexa-ai'));
        }

        $host = strtolower($parts['host']);

        // Check if host is direct IP or name
        $isIp = filter_var($host, FILTER_VALIDATE_IP) !== false;
        $ipsToCheck = [];

        if ($isIp) {
            $ipsToCheck[] = $host;
        } else {
            if ($host === 'localhost') {
                return new WP_Error('blognexa_ssrf_blocked_host', __('Connecting to localhost is forbidden.', 'blognexa-ai'));
            }
            $resolved = gethostbynamel($host);
            if (is_array($resolved)) {
                $ipsToCheck = $resolved;
            } else {
                $single = gethostbyname($host);
                if ($single !== $host) {
                    $ipsToCheck[] = $single;
                }
            }
        }

        foreach ($ipsToCheck as $ip) {
            // Check loopback
            if (str_starts_with($ip, '127.') || $ip === '::1') {
                return new WP_Error('blognexa_ssrf_loopback', __('Destination resolves to loopback address.', 'blognexa-ai'));
            }

            // Check cloud metadata link-local
            if (str_starts_with($ip, '169.254.')) {
                return new WP_Error('blognexa_ssrf_cloud_metadata', __('Connecting to cloud metadata endpoint is forbidden.', 'blognexa-ai'));
            }

            // Check private & reserved ranges
            if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return new WP_Error('blognexa_ssrf_private_ip', __('Destination resolves to a private or reserved IP address.', 'blognexa-ai'));
            }
        }

        return true;
    }
}
