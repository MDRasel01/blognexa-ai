<?php
/**
 * BlogNexa AI - WordPress Custom Post Type Auto-Discovery & Policy Manager
 *
 * @package BlogNexaAI\Integrations
 */

declare(strict_types=1);

namespace BlogNexaAI\Integrations;

if (!defined('ABSPATH')) {
    exit;
}

final class PostTypeManager
{
    public const OPTION_ENABLED_TYPES = 'blognexa_enabled_post_types';

    /**
     * Internal WordPress post types to always exclude.
     */
    private const EXCLUDED_CORE_TYPES = [
        'attachment',
        'revision',
        'nav_menu_item',
        'custom_css',
        'customize_changeset',
        'oembed_cache',
        'user_request',
        'wp_block',
        'wp_template',
        'wp_template_part',
        'wp_navigation',
        'wp_font_family',
        'wp_font_face',
    ];

    /**
     * Discover all registered post types on this WordPress installation.
     *
     * @return array<array<string, mixed>>
     */
    public static function discoverPostTypes(): array
    {
        $allTypes = get_post_types([], 'objects');
        $enabledList = self::getEnabledPostTypes();
        $results = [];

        foreach ($allTypes as $slug => $obj) {
            if (in_array($slug, self::EXCLUDED_CORE_TYPES, true)) {
                continue;
            }

            $isPublic = !empty($obj->public) || !empty($obj->publicly_queryable);
            $inRest = !empty($obj->show_in_rest);
            $countObj = function_exists('wp_count_posts') ? wp_count_posts($slug) : (object) ['publish' => 0];
            $publishedCount = isset($countObj->publish) ? (int) $countObj->publish : 0;

            $results[] = [
                'slug'            => $slug,
                'name'            => $slug,
                'label'           => (string) ($obj->labels->name ?? ucfirst($slug)),
                'singular_label'  => (string) ($obj->labels->singular_name ?? ucfirst($slug)),
                'is_public'       => $isPublic,
                'show_in_rest'    => $inRest,
                'is_builtin'      => !empty($obj->_builtin),
                'published_count' => $publishedCount,
                'is_enabled'      => in_array($slug, $enabledList, true),
                'description'     => (string) ($obj->description ?? ''),
            ];
        }

        return $results;
    }

    /**
     * Get list of slugs authorized for BlogNexa AI generation & publishing.
     *
     * @return array<string>
     */
    public static function getEnabledPostTypes(): array
    {
        $saved = get_option(self::OPTION_ENABLED_TYPES, null);
        if ($saved === null || !is_array($saved)) {
            return ['post', 'page'];
        }

        return array_values(array_filter(array_map('sanitize_key', $saved)));
    }

    /**
     * Update authorized post types.
     *
     * @param array<string> $types
     * @return bool
     */
    public static function setEnabledPostTypes(array $types): bool
    {
        $clean = [];
        $registered = get_post_types([], 'objects');
        $validSlugs = is_array($registered) ? array_keys($registered) : [];

        foreach ($types as $t) {
            $slug = sanitize_key((string) $t);
            if (in_array($slug, $validSlugs, true) && !in_array($slug, self::EXCLUDED_CORE_TYPES, true)) {
                $clean[] = $slug;
            }
        }

        if (empty($clean)) {
            $clean = ['post']; // Must contain at least post
        }

        return update_option(self::OPTION_ENABLED_TYPES, array_unique($clean));
    }

    /**
     * Check if a specific post type is authorized.
     */
    public static function isTypeEnabled(string $slug): bool
    {
        return in_array(sanitize_key($slug), self::getEnabledPostTypes(), true);
    }
}
