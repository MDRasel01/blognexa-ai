<?php
/**
 * BlogNexa AI - Request Signer Security & Vector Tests
 *
 * @package BlogNexaAI\Tests\Security
 */

declare(strict_types=1);

namespace BlogNexaAI\Tests\Security;

use BlogNexaAI\Infrastructure\HTTP\RequestSigner;

final class RequestSignerTest
{
    public static function run(): array
    {
        $results = [];

        // Test 1: Canonical query string sorting
        $queryInput = ['b_param' => 'value2', 'a_param' => 'value1', 'c_param' => 'hello world'];
        $canonicalQuery = RequestSigner::buildCanonicalQuery($queryInput);
        $expectedQuery = 'a_param=value1&b_param=value2&c_param=hello%20world';

        $results[] = [
            'name'   => 'RequestSigner sorts query parameters alphabetically',
            'passed' => $canonicalQuery === $expectedQuery,
            'detail' => "Got: {$canonicalQuery}",
        ];

        // Test 2: Standard Test Vector Verification
        $method = 'POST';
        $path = '/v1/jobs';
        $query = 'action=create&priority=high';
        $timestamp = 1731175200;
        $nonce = 'test-nonce-123456789';
        $keyVersion = '1';
        $requestId = 'req-uuid-987654321';
        $body = '{"prompt":"Write a blog about AI agents","target_words":1200}';
        $secret = 'secret-key-32-chars-long-123456';
        $credentialId = 'cred-test-tenant-001';

        $headers = RequestSigner::signRequest(
            $method,
            $path,
            $query,
            $body,
            $credentialId,
            $secret,
            $keyVersion,
            $nonce,
            $timestamp,
            $requestId
        );

        $expectedBodySha256 = '508616b0fae44ebe7988379e9efe49f34a103453cea848cee9afc8be065c3411';
        $expectedSignature = 'a7e8a492a81adf7dbbdff63b0788d1419da762a3d4ccc8fb0f62bcab3d88d44b';
        $expectedAuth = "BNX-HMAC {$credentialId}:{$expectedSignature}";

        $bodyShaMatch = ($headers[RequestSigner::HEADER_CONTENT_SHA256] ?? '') === $expectedBodySha256;
        $authMatch = ($headers[RequestSigner::HEADER_AUTHORIZATION] ?? '') === $expectedAuth;

        $results[] = [
            'name'   => 'RequestSigner matches standard specification test vector',
            'passed' => $bodyShaMatch && $authMatch,
            'detail' => "Signature: {$expectedSignature}",
        ];

        // Test 3: Constant-time signature verification
        $canonicalStr = RequestSigner::buildCanonicalString(
            $method,
            $path,
            $query,
            $timestamp,
            $nonce,
            $keyVersion,
            $requestId,
            $expectedBodySha256
        );

        $validVerification = RequestSigner::verifySignature($expectedSignature, $canonicalStr, $secret);
        $invalidVerification = RequestSigner::verifySignature('bad_signature_00000000000000000000000000000000000000000000000000000000', $canonicalStr, $secret);

        $results[] = [
            'name'   => 'RequestSigner verifies valid signature and rejects corrupted signature',
            'passed' => $validVerification && !$invalidVerification,
            'detail' => 'Valid verified, corrupted signature rejected',
        ];

        return $results;
    }
}

