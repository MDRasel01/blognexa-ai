<?php
/**
 * BlogNexa AI - Authenticated Credential Store
 *
 * @package BlogNexaAI\Security
 */

declare(strict_types=1);

namespace BlogNexaAI\Security;

if (!defined('ABSPATH')) {
    exit;
}

final class CredentialStore
{
    public const OPTION_ENCRYPTED_CREDENTIALS = 'blognexa_encrypted_credentials';
    private const CIPHER_AES = 'AES-256-CBC';

    /**
     * Store credentials safely using authenticated encryption.
     *
     * @param array<string, mixed> $credentials
     * @return bool True on success, false on failure
     */
    public static function storeCredentials(array $credentials): bool
    {
        if (empty($credentials['credential_id']) || empty($credentials['api_secret'])) {
            return false;
        }

        $jsonPayload = wp_json_encode($credentials);
        if ($jsonPayload === false) {
            return false;
        }

        $envelope = self::encryptPayload($jsonPayload);
        if ($envelope === null) {
            return false;
        }

        return (bool) update_option(self::OPTION_ENCRYPTED_CREDENTIALS, $envelope, false);
    }

    /**
     * Retrieve decrypted credentials.
     *
     * @return array<string, mixed>|null Returns associative array or null if missing/tampered
     */
    public static function getCredentials(): ?array
    {
        $rawEnvelope = get_option(self::OPTION_ENCRYPTED_CREDENTIALS);
        if (!is_string($rawEnvelope) || empty($rawEnvelope)) {
            return null;
        }

        $jsonPayload = self::decryptPayload($rawEnvelope);
        if ($jsonPayload === null) {
            return null;
        }

        $data = json_decode($jsonPayload, true);
        return is_array($data) ? $data : null;
    }

    /**
     * Check if valid credentials exist.
     */
    public static function hasCredentials(): bool
    {
        $creds = self::getCredentials();
        return !empty($creds['credential_id']) && !empty($creds['api_secret']);
    }

    /**
     * Clear and delete credentials.
     */
    public static function clearCredentials(): bool
    {
        return (bool) delete_option(self::OPTION_ENCRYPTED_CREDENTIALS);
    }

    /**
     * Derive encryption master key.
     */
    private static function getMasterKey(): string
    {
        // 1. External configuration takes highest priority
        if (defined('BLOGNEXA_CREDENTIAL_ENCRYPTION_KEY') && is_string(BLOGNEXA_CREDENTIAL_ENCRYPTION_KEY) && BLOGNEXA_CREDENTIAL_ENCRYPTION_KEY !== '') {
            return hash('sha256', BLOGNEXA_CREDENTIAL_ENCRYPTION_KEY, true);
        }

        // 2. WordPress core salts fallback
        $salt = (defined('AUTH_KEY') ? AUTH_KEY : 'bnx_auth_salt_default_') .
                (defined('SECURE_AUTH_KEY') ? SECURE_AUTH_KEY : 'bnx_sec_salt_default_') .
                (defined('LOGGED_IN_SALT') ? LOGGED_IN_SALT : 'bnx_logged_salt_');

        return hash('sha256', $salt . ':bnx_v1_kdf', true);
    }

    /**
     * Encrypt plaintext into versioned JSON envelope.
     */
    public static function encryptPayload(string $plaintext): ?string
    {
        $key = self::getMasterKey();

        // 1. Preferred libsodium authenticated secretbox
        if (function_exists('sodium_crypto_secretbox')) {
            $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
            $ciphertext = sodium_crypto_secretbox($plaintext, $nonce, $key);

            $envelope = [
                'v'          => 1,
                'alg'        => 'sodium_secretbox',
                'nonce'      => base64_encode($nonce),
                'ciphertext' => base64_encode($ciphertext),
            ];

            return wp_json_encode($envelope);
        }

        // 2. OpenSSL AES-256-CBC with Encrypt-then-MAC (HMAC-SHA256) fallback
        if (function_exists('openssl_encrypt')) {
            $ivLength = openssl_cipher_iv_length(self::CIPHER_AES);
            $iv = random_bytes($ivLength);
            $rawCiphertext = openssl_encrypt($plaintext, self::CIPHER_AES, $key, OPENSSL_RAW_DATA, $iv);

            if ($rawCiphertext === false) {
                return null;
            }

            $hmac = hash_hmac('sha256', $iv . $rawCiphertext, $key, true);

            $envelope = [
                'v'          => 1,
                'alg'        => 'openssl_aes256cbc_hmac',
                'nonce'      => base64_encode($iv),
                'ciphertext' => base64_encode($rawCiphertext),
                'mac'        => base64_encode($hmac),
            ];

            return wp_json_encode($envelope);
        }

        return null;
    }

    /**
     * Decrypt versioned JSON envelope.
     */
    public static function decryptPayload(string $envelopeJson): ?string
    {
        $envelope = json_decode($envelopeJson, true);
        if (!is_array($envelope) || empty($envelope['alg']) || empty($envelope['nonce']) || empty($envelope['ciphertext'])) {
            return null;
        }

        $key = self::getMasterKey();
        $nonce = base64_decode((string) $envelope['nonce'], true);
        $ciphertext = base64_decode((string) $envelope['ciphertext'], true);

        if ($nonce === false || $ciphertext === false) {
            return null;
        }

        // 1. Libsodium secretbox
        if ($envelope['alg'] === 'sodium_secretbox') {
            if (!function_exists('sodium_crypto_secretbox_open')) {
                return null;
            }

            $plaintext = sodium_crypto_secretbox_open($ciphertext, $nonce, $key);
            if ($plaintext === false) {
                return null; // Tampered or wrong key
            }

            return $plaintext;
        }

        // 2. OpenSSL AES-256-CBC + HMAC
        if ($envelope['alg'] === 'openssl_aes256cbc_hmac') {
            if (!function_exists('openssl_decrypt') || empty($envelope['mac'])) {
                return null;
            }

            $expectedMac = base64_decode((string) $envelope['mac'], true);
            if ($expectedMac === false) {
                return null;
            }

            $calculatedMac = hash_hmac('sha256', $nonce . $ciphertext, $key, true);
            if (!hash_equals($expectedMac, $calculatedMac)) {
                return null; // Tampered payload
            }

            $plaintext = openssl_decrypt($ciphertext, self::CIPHER_AES, $key, OPENSSL_RAW_DATA, $nonce);
            return $plaintext !== false ? $plaintext : null;
        }

        return null;
    }
}

