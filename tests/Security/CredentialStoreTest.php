<?php
/**
 * BlogNexa AI - Credential Store Security Tests
 *
 * @package BlogNexaAI\Tests\Security
 */

declare(strict_types=1);

namespace BlogNexaAI\Tests\Security;

use BlogNexaAI\Security\CredentialStore;

final class CredentialStoreTest
{
    public static function run(): array
    {
        $results = [];

        // Test 1: Store and retrieve credentials
        $testCreds = [
            'credential_id' => 'cred-test-suite-001',
            'api_secret'    => 'secret-key-32-chars-long-123456',
            'key_version'   => '1',
            'tenant_id'     => 'c1234567-89ab-cdef-0123-456789abcdef',
            'site_id'       => 's9876543-21ba-fedc-3210-fedcba987654',
        ];

        $saved = CredentialStore::storeCredentials($testCreds);
        $retrieved = CredentialStore::getCredentials();

        $match = $retrieved !== null &&
                 $retrieved['credential_id'] === $testCreds['credential_id'] &&
                 $retrieved['api_secret'] === $testCreds['api_secret'] &&
                 $retrieved['tenant_id'] === $testCreds['tenant_id'];

        $results[] = [
            'name'   => 'CredentialStore encrypts, stores and decrypts credentials',
            'passed' => $saved && $match,
            'detail' => $match ? 'Credentials roundtrip verified' : 'Mismatch or null retrieved',
        ];

        // Test 2: Verify encrypted payload in options is not plaintext
        $rawOption = get_option(CredentialStore::OPTION_ENCRYPTED_CREDENTIALS);
        $isNotPlaintext = is_string($rawOption) && !str_contains($rawOption, 'secret-key-32-chars-long-123456');

        $results[] = [
            'name'   => 'CredentialStore ensures zero plaintext secrets in storage',
            'passed' => $isNotPlaintext,
            'detail' => 'Storage contains encrypted envelope',
        ];

        // Test 3: Tamper detection (modify ciphertext)
        $envelope = json_decode($rawOption, true);
        if (is_array($envelope) && isset($envelope['ciphertext'])) {
            $tamperedCiphertext = base64_encode(base64_decode($envelope['ciphertext']) ^ "\x01");
            $envelope['ciphertext'] = $tamperedCiphertext;
            $tamperedJson = json_encode($envelope);

            $decrypted = CredentialStore::decryptPayload($tamperedJson);
            $tamperCaught = $decrypted === null;

            $results[] = [
                'name'   => 'CredentialStore rejects tampered ciphertext (Authenticated Encryption)',
                'passed' => $tamperCaught,
                'detail' => $tamperCaught ? 'Tampered payload rejected with null' : 'Tamper not detected!',
            ];
        }

        // Test 4: Clear credentials
        $cleared = CredentialStore::clearCredentials();
        $hasAfterClear = CredentialStore::hasCredentials();

        $results[] = [
            'name'   => 'CredentialStore purge removes credentials cleanly',
            'passed' => $cleared && !$hasAfterClear,
            'detail' => 'hasCredentials() returns false after clear',
        ];

        return $results;
    }
}
