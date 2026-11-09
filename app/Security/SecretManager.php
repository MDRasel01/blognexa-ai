<?php
/**
 * BlogNexa AI - Secret Manager (Encryption & Safe Storage)
 *
 * @package BlogNexaAI\Security
 */

declare(strict_types=1);

namespace BlogNexaAI\Security;

if (!defined('ABSPATH')) {
    exit;
}

final class SecretManager
{
    private const CIPHER = 'AES-256-CBC';

    /**
     * Get encryption key derived from WordPress AUTH_KEY and SECURE_AUTH_KEY.
     *
     * @return string
     */
    private static function getMasterKey(): string
    {
        $salt = (defined('AUTH_KEY') ? AUTH_KEY : 'bnx_auth_fallback_salt_') .
                (defined('SECURE_AUTH_KEY') ? SECURE_AUTH_KEY : 'bnx_sec_fallback_salt_');

        return hash('sha256', $salt, true);
    }

    /**
     * Encrypt sensitive string (e.g. API Keys, Bearer Tokens).
     *
     * @param string $plainText
     * @return string Base64 encoded payload: iv.ciphertext.hmac
     */
    public static function encrypt(string $plainText): string
    {
        if ($plainText === '') {
            return '';
        }

        $key = self::getMasterKey();

        // 1. Preferred OpenSSL AES-256-CBC
        if (function_exists('openssl_encrypt') && function_exists('openssl_cipher_iv_length')) {
            $ivLength = openssl_cipher_iv_length(self::CIPHER);
            $iv = function_exists('openssl_random_pseudo_bytes')
                ? openssl_random_pseudo_bytes($ivLength)
                : random_bytes($ivLength);

            $cipherText = openssl_encrypt($plainText, self::CIPHER, $key, OPENSSL_RAW_DATA, $iv);
            if ($cipherText !== false) {
                $hmac = hash_hmac('sha256', $iv . $cipherText, $key, true);
                return 'ossl:' . base64_encode($iv . $hmac . $cipherText);
            }
        }

        // 2. Safe Cryptographic Fallback (Stream XOR cipher with SHA-256 HMAC) for environments without OpenSSL ext
        $nonce = random_bytes(16);
        $streamKey = hash('sha256', $key . $nonce, true);
        $cipherText = '';
        $textLen = strlen($plainText);
        for ($i = 0; $i < $textLen; $i++) {
            $cipherText .= $plainText[$i] ^ $streamKey[$i % 32];
        }

        $hmac = hash_hmac('sha256', $nonce . $cipherText, $key, true);
        return 'strc:' . base64_encode($nonce . $hmac . $cipherText);
    }

    /**
     * Decrypt encrypted string.
     *
     * @param string $encryptedPayload
     * @return string|null Decrypted string or null on tampering/failure
     */
    public static function decrypt(string $encryptedPayload): ?string
    {
        if ($encryptedPayload === '') {
            return '';
        }

        $key = self::getMasterKey();

        // Handle OpenSSL encrypted payload
        if (str_starts_with($encryptedPayload, 'ossl:')) {
            if (!function_exists('openssl_decrypt')) {
                return null;
            }
            $raw = base64_decode(substr($encryptedPayload, 5), true);
            if ($raw === false) {
                return null;
            }

            $ivLength = openssl_cipher_iv_length(self::CIPHER);
            $hmacLength = 32;

            if (strlen($raw) < $ivLength + $hmacLength) {
                return null;
            }

            $iv = substr($raw, 0, $ivLength);
            $hmac = substr($raw, $ivLength, $hmacLength);
            $cipherText = substr($raw, $ivLength + $hmacLength);

            $calculatedHmac = hash_hmac('sha256', $iv . $cipherText, $key, true);
            if (!hash_equals($hmac, $calculatedHmac)) {
                return null;
            }

            $decrypted = openssl_decrypt($cipherText, self::CIPHER, $key, OPENSSL_RAW_DATA, $iv);
            return $decrypted !== false ? $decrypted : null;
        }

        // Handle Stream cipher fallback payload
        if (str_starts_with($encryptedPayload, 'strc:')) {
            $raw = base64_decode(substr($encryptedPayload, 5), true);
            if ($raw === false || strlen($raw) < 48) {
                return null;
            }

            $nonce = substr($raw, 0, 16);
            $hmac = substr($raw, 16, 32);
            $cipherText = substr($raw, 48);

            $calculatedHmac = hash_hmac('sha256', $nonce . $cipherText, $key, true);
            if (!hash_equals($hmac, $calculatedHmac)) {
                return null;
            }

            $streamKey = hash('sha256', $key . $nonce, true);
            $plainText = '';
            $cipherLen = strlen($cipherText);
            for ($i = 0; $i < $cipherLen; $i++) {
                $plainText .= $cipherText[$i] ^ $streamKey[$i % 32];
            }

            return $plainText;
        }

        return null;
    }

    /**
     * Redact sensitive credentials from logs and API views.
     *
     * @param string $secret
     * @return string
     */
    public static function redact(string $secret): string
    {
        $len = strlen($secret);
        if ($len <= 8) {
            return '********';
        }

        return substr($secret, 0, 4) . str_repeat('*', $len - 8) . substr($secret, -4);
    }
}
