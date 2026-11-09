<?php
/**
 * BlogNexa AI - Audit Logger Service
 *
 * @package BlogNexaAI\Security
 */

declare(strict_types=1);

namespace BlogNexaAI\Security;

use BlogNexaAI\Database\Repositories\AuditRepository;

if (!defined('ABSPATH')) {
    exit;
}

final class AuditLogger
{
    private static ?AuditRepository $repository = null;

    private static function getRepository(): AuditRepository
    {
        if (self::$repository === null) {
            self::$repository = new AuditRepository();
        }
        return self::$repository;
    }

    /**
     * Log a security or operational event.
     *
     * @param string $action
     * @param string $objectType
     * @param string $objectId
     * @param array<string, mixed> $details
     */
    public static function log(
        string $action,
        string $objectType = '',
        string $objectId = '',
        array $details = []
    ): void {
        $userId = get_current_user_id();
        $ipAddress = self::getClientIp();

        // Redact any sensitive keys in details
        $sanitizedDetails = self::redactSensitiveKeys($details);

        self::getRepository()->record($userId, $action, $objectType, $objectId, $sanitizedDetails, $ipAddress);
    }

    /**
     * Get client IP safely.
     *
     * @return string
     */
    private static function getClientIp(): string
    {
        $remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '';
        return filter_var($remoteAddr, FILTER_VALIDATE_IP) ? (string) $remoteAddr : '0.0.0.0';
    }

    /**
     * Redact sensitive keys recursively.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private static function redactSensitiveKeys(array $data): array
    {
        $sensitiveKeys = ['api_key', 'token', 'secret', 'password', 'key', 'auth'];

        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = self::redactSensitiveKeys($value);
            } elseif (is_string($key) && in_array(strtolower($key), $sensitiveKeys, true) && is_string($value)) {
                $data[$key] = SecretManager::redact($value);
            }
        }

        return $data;
    }
}

