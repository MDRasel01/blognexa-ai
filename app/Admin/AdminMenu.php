<?php
/**
 * BlogNexa AI - WordPress Admin Menu Registrar
 *
 * @package BlogNexaAI\Admin
 */

declare(strict_types=1);

namespace BlogNexaAI\Admin;

if (!defined('ABSPATH')) {
    exit;
}

final class AdminMenu
{
    public const MENU_SLUG = 'blognexa-ai';

    /**
     * Submenu definitions corresponding to the 11 product modules.
     *
     * @var array<string, array{title: string, cap: string, path: string}>
     */
    private const SUBMENUS = [
        'overview' => [
            'title' => 'Overview',
            'cap'   => BLOGNEXA_CAP_ACCESS,
            'path'  => '',
        ],
        'website-intelligence' => [
            'title' => 'Website Intelligence',
            'cap'   => BLOGNEXA_CAP_SCAN_WEBSITE,
            'path'  => 'website-intelligence',
        ],
        'knowledge-base' => [
            'title' => 'Knowledge Base',
            'cap'   => BLOGNEXA_CAP_MANAGE_KNOWLEDGE,
            'path'  => 'knowledge-base',
        ],
        'content-strategy' => [
            'title' => 'Content Strategy',
            'cap'   => BLOGNEXA_CAP_MANAGE_STRATEGY,
            'path'  => 'content-strategy',
        ],
        'seo-research' => [
            'title' => 'SEO Research',
            'cap'   => BLOGNEXA_CAP_MANAGE_SEO,
            'path'  => 'seo-research',
        ],
        'blog-studio' => [
            'title' => 'Blog Studio',
            'cap'   => BLOGNEXA_CAP_CREATE_BLOG,
            'path'  => 'blog-studio',
        ],
        'image-studio' => [
            'title' => 'AI Image Studio',
            'cap'   => BLOGNEXA_CAP_CREATE_BLOG,
            'path'  => 'image-studio',
        ],
        'publishing' => [
            'title' => 'Publishing & Scheduling',
            'cap'   => BLOGNEXA_CAP_PUBLISH_BLOG,
            'path'  => 'publishing',
        ],
        'analytics' => [
            'title' => 'Performance Analytics',
            'cap'   => BLOGNEXA_CAP_VIEW_ANALYTICS,
            'path'  => 'analytics',
        ],
        'integrations' => [
            'title' => 'Integrations',
            'cap'   => BLOGNEXA_CAP_MANAGE_INTEGRATIONS,
            'path'  => 'integrations',
        ],
        'settings' => [
            'title' => 'Settings',
            'cap'   => BLOGNEXA_CAP_MANAGE_SETTINGS,
            'path'  => 'settings',
        ],
    ];

    /**
     * Register Admin Menus.
     */
    public function register(): void
    {
        add_action('admin_menu', [$this, 'addMenus']);
    }

    /**
     * Build top-level menu and submenus.
     */
    public function addMenus(): void
    {
        // Top-level Menu
        add_menu_page(
            __('BlogNexa AI', 'blognexa-ai'),
            __('BlogNexa AI', 'blognexa-ai'),
            BLOGNEXA_CAP_ACCESS,
            self::MENU_SLUG,
            [AdminPage::class, 'render'],
            'dashicons-superhero',
            30
        );

        // Submenus
        foreach (self::SUBMENUS as $slug => $item) {
            $subSlug = empty($item['path']) ? self::MENU_SLUG : self::MENU_SLUG . '-' . $slug;
            add_submenu_page(
                self::MENU_SLUG,
                __($item['title'], 'blognexa-ai'),
                __($item['title'], 'blognexa-ai'),
                $item['cap'],
                $subSlug,
                [AdminPage::class, 'render']
            );
        }
    }
}

