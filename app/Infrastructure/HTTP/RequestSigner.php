<?php
/**
 * BlogNexa AI - Canonical HMAC Request Signer
 *
 * @package BlogNexaAI\Infrastructure\HTTP
 */

declare(strict_types=1);

namespace BlogNexaAI\Infrastructure\HTTP;

if (!defined('ABSPATH')) {
    exit;
}

final class RequestSigner
{
    public const PROTOCOL_PREFIX = 'BNX-HMAC';
    public const HEADER_AUTHORIZATION = 'Authorization';
    public const HEADER_TIMESTAMP     = 'X-BNX-Timestamp';
    public const HEADER_NONCE         = 'X-BNX-Nonce';
    public const HEADER_KEY_VERSION   = 'X-BNX-Key-Version';
    public const HEADER_REQUEST_ID    = 'X-BNX-Request-ID';
    public const HEADER_CONTENT_SHA256 = 'X-BNX-Content-SHA256';

    /**
     * Build canonical query string sorted alphabetically by parameter key.
     *
     * @param array<string, mixed>|string $query
     * @return string
     */
    public static function buildCanonicalQuery(array|string $query): string
    {
        if (is_string($query)) {
            $query = trim($query, '?');
            if ($query === '') {
                return '';
            }
            parse_str($query, $parsed);
            $query = $parsed;
        }

        if (empty($query)) {
            return '';
        }

        ksort($query, SORT_STRING);

        $pairs = [];
        foreach ($query as $key => $val) {
            $encodedKey = rawurlencode((string) $key);
            $encodedVal = rawurlencode((string) $val);
            $pairs[] = "{$encodedKey}={$encodedVal}";
        }

        return implode('&', $pairs);
    }

    /**
     * Construct the 8-line canonical request string.
     */
    public static function buildCanonicalString(
        string $method,
        string $path,
        string $query,
        int|string $timestamp,
        string $nonce,
        string $keyVersion,
        string $requestId,
        string $bodySha256
    ): string {
        $canonicalPath = '/' . ltrim($path, '/');

        return implode("\n", [
            strtoupper($method),
            $canonicalPath,
            $query,
            (string) $timestamp,
            $nonce,
            $keyVersion,
            $requestId,
            strtolower($bodySha256)
        ]);
    }

    /**
     * Sign an outgoing request and return all security headers.
     *
     * @param string $method HTTP method (GET, POST, etc.)
     * @param string $path Target URI path (e.g. /v1/jobs)
     * @param array<string, mixed>|string $query Query parameters
     * @param string $body Raw HTTP request body
     * @param string $credentialId Credential public identifier
     * @param string $apiSecret Pre-shared HMAC signing secret
     * @param string $keyVersion Key version (default "1")
     * @param string|null $nonce Optional nonce override (for testing)
     * @param int|null $timestamp Optional timestamp override (for testing)
     * @param string|null $requestId Optional request ID override (for testing)
     * @return array<string, string> Associative map of HTTP headers
     */
    public static function signRequest(
        string $method,
        string $path,
        array|string $query,
        string $body,
        string $credentialId,
        string $apiSecret,
        string $keyVersion = '1',
        ?string $nonce = null,
        ?int $timestamp = null,
        ?string $requestId = null
    ): array {
        $ts = $timestamp ?? time();
        $nc = $nonce ?? bin2hex(random_bytes(16));
        $reqId = $requestId ?? self::generateUuidV4();
        $bodySha256 = hash('sha256', $body);
        $canonicalQuery = self::buildCanonicalQuery($query);

        $canonicalString = self::buildCanonicalString(
            $method,
            $path,
            $canonicalQuery,
            $ts,
            $nc,
            $keyVersion,
            $reqId,
            $bodySha256
        );

        $signature = hash_hmac('sha256', $canonicalString, $apiSecret);

        return [
            self::HEADER_AUTHORIZATION => self::PROTOCOL_PREFIX . " {$credentialId}:{$signature}",
            self::HEADER_TIMESTAMP     => (string) $ts,
            self::HEADER_NONCE         => $nc,
            self::HEADER_KEY_VERSION   => $keyVersion,
            self::HEADER_REQUEST_ID    => $reqId,
            self::HEADER_CONTENT_SHA256 => $bodySha256,
        ];
    }

    /**
     * Verify signature using constant-time comparison.
     */
    public static function verifySignature(
        string $signature,
        string $canonicalString,
        string $apiSecret
    ): bool {
        $expected = hash_hmac('sha256', $canonicalString, $apiSecret);
        return hash_equals($expected, $signature);
    }

    /**
     * Generate UUIDv4 for request tracing.
     */
    private static function generateUuidV4(): string
    {
        $data = random_bytes(16);
        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}

