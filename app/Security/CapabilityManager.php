<?php
/**
 * BlogNexa AI - Capability Manager
 *
 * @package BlogNexaAI\Security
 */

declare(strict_types=1);

namespace BlogNexaAI\Security;

if (!defined('ABSPATH')) {
    exit;
}

final class CapabilityManager
{
    /**
     * All capabilities managed by BlogNexa AI.
     *
     * @var array<string>
     */
    public const ALL_CAPABILITIES = [
        BLOGNEXA_CAP_ACCESS,
        BLOGNEXA_CAP_MANAGE_SETTINGS,
        BLOGNEXA_CAP_SCAN_WEBSITE,
        BLOGNEXA_CAP_MANAGE_KNOWLEDGE,
        BLOGNEXA_CAP_MANAGE_STRATEGY,
        BLOGNEXA_CAP_MANAGE_SEO,
        BLOGNEXA_CAP_CREATE_BLOG,
        BLOGNEXA_CAP_EDIT_BLOG,
        BLOGNEXA_CAP_APPROVE_BLOG,
        BLOGNEXA_CAP_PUBLISH_BLOG,
        BLOGNEXA_CAP_MANAGE_INTEGRATIONS,
        BLOGNEXA_CAP_VIEW_ANALYTICS,
        BLOGNEXA_CAP_MANAGE_DATA,
    ];

    /**
     * Role to capabilities mapping.
     *
     * @return array<string, array<string>>
     */
    public static function getRoleCapabilitiesMapping(): array
    {
        return [
            'administrator' => self::ALL_CAPABILITIES,
            'editor' => [
                BLOGNEXA_CAP_ACCESS,
                BLOGNEXA_CAP_MANAGE_KNOWLEDGE,
                BLOGNEXA_CAP_MANAGE_STRATEGY,
                BLOGNEXA_CAP_MANAGE_SEO,
                BLOGNEXA_CAP_CREATE_BLOG,
                BLOGNEXA_CAP_EDIT_BLOG,
                BLOGNEXA_CAP_APPROVE_BLOG,
                BLOGNEXA_CAP_PUBLISH_BLOG,
                BLOGNEXA_CAP_VIEW_ANALYTICS,
            ],
            'author' => [
                BLOGNEXA_CAP_ACCESS,
                BLOGNEXA_CAP_CREATE_BLOG,
                BLOGNEXA_CAP_EDIT_BLOG,
            ],
        ];
    }

    /**
     * Register custom capabilities across WordPress roles on activation.
     */
    public static function registerCapabilities(): void
    {
        $mapping = self::getRoleCapabilitiesMapping();

        foreach ($mapping as $roleName => $caps) {
            $role = get_role($roleName);
            if ($role) {
                foreach ($caps as $cap) {
                    $role->add_cap($cap);
                }
            }
        }
    }

    /**
     * Remove custom capabilities on full uninstall.
     */
    public static function removeCapabilities(): void
    {
        $mapping = self::getRoleCapabilitiesMapping();

        foreach ($mapping as $roleName => $caps) {
            $role = get_role($roleName);
            if ($role) {
                foreach ($caps as $cap) {
                    $role->remove_cap($cap);
                }
            }
        }
    }
}

