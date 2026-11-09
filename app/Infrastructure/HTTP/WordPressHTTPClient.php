<?php
/**
 * BlogNexa AI - WordPress HTTP Client with SSRF Guard & HMAC Signing
 *
 * @package BlogNexaAI\Infrastructure\HTTP
 */

declare(strict_types=1);

namespace BlogNexaAI\Infrastructure\HTTP;

use BlogNexaAI\Security\CredentialStore;
use WP_Error;

if (!defined('ABSPATH')) {
    exit;
}

final class WordPressHTTPClient implements BackendClientInterface
{
    private string $baseUrl;
    private int $timeout;
    private bool $signRequests;

    public function __construct(string $baseUrl = 'https://api.blognexa.ai', int $timeout = 20, bool $signRequests = true)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->timeout = $timeout;
        $this->signRequests = $signRequests;
    }

    /**
     * Send GET request.
     */
    public function get(string $endpoint, array $headers = [], ?int $timeout = null): array|WP_Error
    {
        return $this->request('GET', $endpoint, [], $headers, $timeout);
    }

    /**
     * Send POST request.
     */
    public function post(string $endpoint, array $body = [], array $headers = [], ?int $timeout = null): array|WP_Error
    {
        return $this->request('POST', $endpoint, $body, $headers, $timeout);
    }

    /**
     * Internal secure request execution.
     */
    private function request(
        string $method,
        string $endpoint,
        array $body = [],
        array $headers = [],
        ?int $timeout = null
    ): array|WP_Error {
        $cleanEndpoint = '/' . ltrim($endpoint, '/');
        $parts = parse_url($cleanEndpoint);
        $path = $parts['path'] ?? $cleanEndpoint;
        $query = $parts['query'] ?? '';

        $fullUrl = $this->baseUrl . $cleanEndpoint;

        // SSRF Guard: Validate destination before network egress
        $ssrfCheck = $this->validateDestinationUrl($fullUrl);
        if (is_wp_error($ssrfCheck)) {
            return $ssrfCheck;
        }

        $rawBody = '';
        if ($method === 'POST' && !empty($body)) {
            $encoded = wp_json_encode($body);
            $rawBody = $encoded !== false ? $encoded : '';
        }

        $signingHeaders = [];
        if ($this->signRequests && CredentialStore::hasCredentials()) {
            $creds = CredentialStore::getCredentials();
            if ($creds && !empty($creds['credential_id']) && !empty($creds['api_secret'])) {
                $signingHeaders = RequestSigner::signRequest(
                    $method,
                    $path,
                    $query,
                    $rawBody,
                    (string) $creds['credential_id'],
                    (string) $creds['api_secret'],
                    (string) ($creds['key_version'] ?? '1')
                );
            }
        }

        $defaultHeaders = [
            'Content-Type' => 'application/json',
            'Accept'       => 'application/json',
            'User-Agent'   => 'BlogNexa-AI-Plugin/' . (defined('BLOGNEXA_VERSION') ? BLOGNEXA_VERSION : '1.0.0'),
        ];

        $allHeaders = array_merge($defaultHeaders, $headers, $signingHeaders);

        $args = [
            'method'      => $method,
            'timeout'     => $timeout ?? $this->timeout,
            'redirection' => 2,
            'httpversion' => '1.1',
            'headers'     => $allHeaders,
            'sslverify'   => true,
        ];

        if ($method === 'POST' && $rawBody !== '') {
            $args['body'] = $rawBody;
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
        $responseBody = wp_remote_retrieve_body($response);
        $data = json_decode($responseBody, true);

        if ($statusCode >= 400) {
            $errorMessage = is_array($data) && isset($data['message'])
                ? $data['message']
                : (is_array($data) && isset($data['detail']) ? (string)$data['detail'] : __('Backend returned an error.', 'blognexa-ai'));

            return new WP_Error('blognexa_backend_error', $errorMessage, [
                'status' => $statusCode,
                'data'   => $data,
            ]);
        }

        return is_array($data) ? $data : ['raw' => $responseBody];
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
            if (str_starts_with($ip, '169.254.') || str_starts_with(strtolower($ip), 'fe80:')) {
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
