<?php
/**
 * BlogNexa AI - Permission Manager
 *
 * @package BlogNexaAI\Security
 */

declare(strict_types=1);

namespace BlogNexaAI\Security;

use WP_REST_Request;
use WP_Error;

if (!defined('ABSPATH')) {
    exit;
}

final class PermissionManager
{
    /**
     * Check if current user has the specified capability.
     *
     * @param string $capability
     * @return bool
     */
    public static function can(string $capability): bool
    {
        return is_user_logged_in() && current_user_can($capability);
    }

    /**
     * Callback for REST routes requiring base access.
     *
     * @param WP_REST_Request|null $request
     * @return bool|WP_Error
     */
    public static function checkAccess(?WP_REST_Request $request = null): bool|WP_Error
    {
        return self::checkCapability(BLOGNEXA_CAP_ACCESS);
    }

    /**
     * Callback for REST routes requiring settings management.
     *
     * @param WP_REST_Request|null $request
     * @return bool|WP_Error
     */
    public static function checkManageSettings(?WP_REST_Request $request = null): bool|WP_Error
    {
        return self::checkCapability(BLOGNEXA_CAP_MANAGE_SETTINGS);
    }

    /**
     * Callback for REST routes requiring website scan.
     *
     * @param WP_REST_Request|null $request
     * @return bool|WP_Error
     */
    public static function checkScanWebsite(?WP_REST_Request $request = null): bool|WP_Error
    {
        return self::checkCapability(BLOGNEXA_CAP_SCAN_WEBSITE);
    }

    /**
     * Callback for REST routes requiring content publishing.
     *
     * @param WP_REST_Request|null $request
     * @return bool|WP_Error
     */
    public static function checkPublishBlog(?WP_REST_Request $request = null): bool|WP_Error
    {
        return self::checkCapability(BLOGNEXA_CAP_PUBLISH_BLOG);
    }

    /**
     * General capability verification with WP_Error response for REST.
     *
     * @param string $capability
     * @return bool|WP_Error
     */
    public static function checkCapability(string $capability): bool|WP_Error
    {
        if (!is_user_logged_in()) {
            return new WP_Error(
                'blognexa_unauthorized',
                __('Authentication required to access BlogNexa AI.', 'blognexa-ai'),
                ['status' => 401]
            );
        }

        if (!current_user_can($capability)) {
            return new WP_Error(
                'blognexa_forbidden',
                __('You do not have the required permission to perform this action.', 'blognexa-ai'),
                ['status' => 403]
            );
        }

        return true;
    }
}

