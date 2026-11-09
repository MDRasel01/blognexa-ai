<?php
/**
 * BlogNexa AI - Nonce Manager
 *
 * @package BlogNexaAI\Security
 */

declare(strict_types=1);

namespace BlogNexaAI\Security;

if (!defined('ABSPATH')) {
    exit;
}

final class NonceManager
{
    public const REST_ACTION = 'wp_rest';
    public const ADMIN_ACTION = 'blognexa_admin_action';

    /**
     * Create REST API nonce.
     *
     * @return string
     */
    public static function createRestNonce(): string
    {
        return wp_create_nonce(self::REST_ACTION);
    }

    /**
     * Verify REST API nonce.
     *
     * @param string $nonce
     * @return bool
     */
    public static function verifyRestNonce(string $nonce): bool
    {
        return (bool) wp_verify_nonce($nonce, self::REST_ACTION);
    }

    /**
     * Create admin action nonce.
     *
     * @param string $action
     * @return string
     */
    public static function createActionNonce(string $action = self::ADMIN_ACTION): string
    {
        return wp_create_nonce($action);
    }

    /**
     * Verify admin action nonce.
     *
     * @param string $nonce
     * @param string $action
     * @return bool
     */
    public static function verifyActionNonce(string $nonce, string $action = self::ADMIN_ACTION): bool
    {
        return (bool) wp_verify_nonce($nonce, $action);
    }
}

