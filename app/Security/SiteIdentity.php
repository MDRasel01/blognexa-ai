<?php
/**
 * BlogNexa AI - Site Identity Manager
 *
 * @package BlogNexaAI\Security
 */

declare(strict_types=1);

namespace BlogNexaAI\Security;

if (!defined('ABSPATH')) {
    exit;
}

final class SiteIdentity
{
    public const OPTION_SITE_INSTANCE_ID = 'blognexa_site_instance_id';
    public const OPTION_REGISTERED_URL   = 'blognexa_registered_url';
    public const OPTION_REGISTERED_AT    = 'blognexa_registered_at';

    /**
     * Get or generate the immutable Site Instance ID (UUIDv4).
     *
     * @return string UUIDv4 identifier
     */
    public static function getSiteInstanceId(): string
    {
        $instanceId = get_option(self::OPTION_SITE_INSTANCE_ID);
        if (is_string($instanceId) && self::isValidUuidV4($instanceId)) {
            return $instanceId;
        }

        $newInstanceId = self::generateUuidV4();
        update_option(self::OPTION_SITE_INSTANCE_ID, $newInstanceId, false);
        return $newInstanceId;
    }

    /**
     * Check if the site was cloned or its home URL changed since registration.
     *
     * @return bool True if cloned or URL changed, false otherwise.
     */
    public static function isCloneOrUrlChanged(): bool
    {
        $registeredUrl = get_option(self::OPTION_REGISTERED_URL);
        if (!is_string($registeredUrl) || empty($registeredUrl)) {
            return false; // Not yet registered with backend
        }

        $currentUrl = home_url();
        return rtrim(strtolower($registeredUrl), '/') !== rtrim(strtolower($currentUrl), '/');
    }

    /**
     * Record registered URL upon successful enrollment.
     *
     * @param string|null $url Optional URL override (defaults to home_url())
     */
    public static function markRegistered(?string $url = null): void
    {
        $targetUrl = $url ?? home_url();
        update_option(self::OPTION_REGISTERED_URL, $targetUrl, false);
        update_option(self::OPTION_REGISTERED_AT, time(), false);
    }

    /**
     * Clear registered URL (e.g. on disconnect or revocation).
     */
    public static function clearRegistration(): void
    {
        delete_option(self::OPTION_REGISTERED_URL);
        delete_option(self::OPTION_REGISTERED_AT);
    }

    /**
     * Get full site metadata dictionary for enrollment handshake.
     *
     * @return array<string, mixed>
     */
    public static function getSiteMetadata(): array
    {
        global $wp_version;

        return [
            'site_instance_id' => self::getSiteInstanceId(),
            'site_url'         => site_url(),
            'home_url'         => home_url(),
            'site_name'        => get_bloginfo('name'),
            'admin_email_hash' => hash('sha256', (string) get_bloginfo('admin_email')),
            'wp_version'       => $wp_version ?? 'unknown',
            'plugin_version'   => defined('BLOGNEXA_VERSION') ? BLOGNEXA_VERSION : '1.0.0',
            'php_version'      => PHP_VERSION,
            'is_multisite'     => is_multisite(),
        ];
    }

    /**
     * Validate UUIDv4 format.
     */
    public static function isValidUuidV4(string $uuid): bool
    {
        return (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $uuid);
    }

    /**
     * Cryptographically secure UUIDv4 generation.
     */
    public static function generateUuidV4(): string
    {
        $data = random_bytes(16);
        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40); // Version 4
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80); // Variant 10xx

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}

