<?php
/**
 * BlogNexa AI - SEO Plugin Auto-Detector & Conflict Resolver
 *
 * @package BlogNexaAI\Integrations
 */

declare(strict_types=1);

namespace BlogNexaAI\Integrations;

if (!defined('ABSPATH')) {
    exit;
}

final class SEODetector
{
    public const OPTION_PRIMARY_SEO = 'blognexa_primary_seo_provider';

    public const PROVIDER_RANK_MATH = 'rankmath';
    public const PROVIDER_YOAST     = 'yoast';
    public const PROVIDER_AIOSEO    = 'aioseo';

    /**
     * Map of supported SEO plugins and their signature files/classes.
     */
    private const SUPPORTED_PLUGINS = [
        self::PROVIDER_RANK_MATH => [
            'name'        => 'Rank Math SEO',
            'slug'        => 'seo-by-rank-math',
            'file'        => 'seo-by-rank-math/seo-by-rank-math.php',
            'class'       => 'RankMath',
            'constant'    => 'RANK_MATH_VERSION',
            'description' => 'Automatically detected WordPress SEO suite.',
        ],
        self::PROVIDER_YOAST => [
            'name'        => 'Yoast SEO',
            'slug'        => 'wordpress-seo',
            'file'        => 'wordpress-seo/wp-seo.php',
            'class'       => 'WPSEO_Options',
            'constant'    => 'WPSEO_VERSION',
            'description' => 'Automatically detected WordPress SEO suite.',
        ],
        self::PROVIDER_AIOSEO => [
            'name'        => 'All in One SEO',
            'slug'        => 'all-in-one-seo-pack',
            'file'        => 'all-in-one-seo-pack/all_in_one_seo_pack.php',
            'class'       => 'AIOSEO\\Plugin\\AIOSEO',
            'constant'    => 'AIOSEO_VERSION',
            'description' => 'Automatically detected WordPress SEO suite.',
        ],
    ];

    /**
     * Detect all supported SEO plugins and their operational states.
     *
     * @return array<string, array<string, mixed>>
     */
    public static function detectAll(): array
    {
        if (!function_exists('get_plugins') && defined('ABSPATH') && file_exists(ABSPATH . 'wp-admin/includes/plugin.php')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $installedPlugins = function_exists('get_plugins') ? get_plugins() : [];
        $activePlugins = (array) get_option('active_plugins', []);

        // Multisite network active check
        $networkActive = is_multisite() ? (array) get_site_option('active_sitewide_plugins', []) : [];

        $results = [];
        $activeCount = 0;
        $activeProviders = [];

        foreach (self::SUPPORTED_PLUGINS as $key => $meta) {
            $file = $meta['file'];
            $slug = $meta['slug'];

            $isInstalled = isset($installedPlugins[$file]) || (defined('WP_PLUGIN_DIR') && file_exists(constant('WP_PLUGIN_DIR') . '/' . $file));
            $isActive = (function_exists('is_plugin_active') && is_plugin_active($file))
                || in_array($file, $activePlugins, true)
                || isset($networkActive[$file])
                || ($meta['class'] !== '' && class_exists($meta['class']))
                || ($meta['constant'] !== '' && defined($meta['constant']));

            $version = 'Unknown';
            if (isset($installedPlugins[$file]['Version'])) {
                $version = (string) $installedPlugins[$file]['Version'];
            } elseif ($meta['constant'] !== '' && defined($meta['constant'])) {
                $version = (string) constant($meta['constant']);
            }

            if ($isActive) {
                $status = 'connected';
                $statusLabel = 'Connected';
                $activeCount++;
                $activeProviders[] = $key;
            } elseif ($isInstalled) {
                $status = 'installed_inactive';
                $statusLabel = 'Installed — Activate Plugin';
            } else {
                $status = 'not_installed';
                $statusLabel = 'Not Installed';
            }

            // Generate safe admin action URLs
            $actionUrl = '';
            if ($status === 'installed_inactive') {
                $actionUrl = wp_nonce_url(
                    admin_url('plugins.php?action=activate&plugin=' . rawurlencode($file)),
                    'activate-plugin_' . $file
                );
            } elseif ($status === 'not_installed') {
                $actionUrl = wp_nonce_url(
                    admin_url('update.php?action=install-plugin&plugin=' . rawurlencode($slug)),
                    'install-plugin_' . $slug
                );
            }

            $results[$key] = [
                'id'           => $key,
                'name'         => $meta['name'],
                'slug'         => $slug,
                'file'         => $file,
                'status'       => $status,
                'status_label' => $statusLabel,
                'version'      => $version,
                'description'  => $meta['description'],
                'action_url'   => $actionUrl,
                'is_active'    => $isActive,
                'is_primary'   => false,
            ];
        }

        // Determine primary SEO provider
        $storedPrimary = (string) get_option(self::OPTION_PRIMARY_SEO, '');
        $primaryKey = null;

        if (!empty($storedPrimary) && in_array($storedPrimary, $activeProviders, true)) {
            $primaryKey = $storedPrimary;
        } elseif (!empty($activeProviders)) {
            // Default priority: Rank Math > Yoast > AIOSEO
            $primaryKey = $activeProviders[0];
        }

        if ($primaryKey && isset($results[$primaryKey])) {
            $results[$primaryKey]['is_primary'] = true;
        }

        return [
            'providers'        => $results,
            'active_count'     => $activeCount,
            'primary_provider' => $primaryKey,
            'has_conflict'     => $activeCount > 1,
            'conflict_message' => $activeCount > 1
                ? sprintf(
                    __('Multiple active SEO plugins detected (%d). BlogNexa AI will write metadata exclusively to %s to prevent duplicate tags.', 'blognexa-ai'),
                    $activeCount,
                    $primaryKey ? $results[$primaryKey]['name'] : 'the primary provider'
                )
                : null,
        ];
    }

    /**
     * Get the active primary SEO provider key.
     *
     * @return string|null
     */
    public static function getPrimaryProvider(): ?string
    {
        $all = self::detectAll();
        return $all['primary_provider'];
    }

    /**
     * Set the primary SEO provider when multiple are active.
     *
     * @param string $provider
     * @return bool
     */
    public static function setPrimaryProvider(string $provider): bool
    {
        if (!array_key_exists($provider, self::SUPPORTED_PLUGINS)) {
            return false;
        }

        return update_option(self::OPTION_PRIMARY_SEO, sanitize_text_field($provider));
    }
}
