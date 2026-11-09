<?php
/**
 * BlogNexa AI - Admin Assets Enqueuer
 *
 * @package BlogNexaAI\Admin
 */

declare(strict_types=1);

namespace BlogNexaAI\Admin;

use BlogNexaAI\Security\NonceManager;
use BlogNexaAI\Security\CapabilityManager;

if (!defined('ABSPATH')) {
    exit;
}

final class AdminAssets
{
    public function register(): void
    {
        add_action('admin_enqueue_scripts', [$this, 'enqueue']);
    }

    /**
     * Enqueue assets only on BlogNexa admin pages.
     *
     * @param string $hookSuffix
     */
    public function enqueue(string $hookSuffix): void
    {
        // Enqueue only on blognexa admin screens
        if (!str_contains($hookSuffix, 'blognexa-ai')) {
            return;
        }

        $assetFile = BLOGNEXA_PATH . 'build/index.asset.php';
        $dependencies = ['wp-element', 'wp-components', 'wp-i18n', 'wp-api-fetch'];
        $version = BLOGNEXA_VERSION;

        if (file_exists($assetFile)) {
            $asset = require $assetFile;
            $dependencies = $asset['dependencies'] ?? $dependencies;
            $version = $asset['version'] ?? $version;
        }

        // Enqueue React Script if built, otherwise placeholder
        $jsUrl = plugins_url('build/index.js', BLOGNEXA_FILE);
        if (file_exists(BLOGNEXA_PATH . 'build/index.js')) {
            wp_enqueue_script(
                'blognexa-admin-app',
                $jsUrl,
                $dependencies,
                $version,
                true
            );
        }

        // Enqueue Styles if built
        $cssUrl = plugins_url('build/index.css', BLOGNEXA_FILE);
        if (file_exists(BLOGNEXA_PATH . 'build/index.css')) {
            wp_enqueue_style(
                'blognexa-admin-styles',
                $cssUrl,
                ['wp-components'],
                $version
            );
        }

        // Localize runtime configuration
        $currentUser = wp_get_current_user();
        $userCaps = [];
        foreach (CapabilityManager::ALL_CAPABILITIES as $cap) {
            $userCaps[$cap] = current_user_can($cap);
        }

        $bootConfig = [
            'api' => [
                'restUrl'   => esc_url_raw(rest_url(BLOGNEXA_REST_NAMESPACE)),
                'nonce'     => NonceManager::createRestNonce(),
                'namespace' => BLOGNEXA_REST_NAMESPACE,
            ],
            'site' => [
                'name'      => get_bloginfo('name'),
                'url'       => get_site_url(),
                'version'   => BLOGNEXA_VERSION,
            ],
            'user' => [
                'id'           => $currentUser->ID,
                'name'         => $currentUser->display_name,
                'capabilities' => $userCaps,
            ],
        ];

        wp_localize_script('blognexa-admin-app', 'blognexaBootConfig', $bootConfig);
        if (wp_script_is('wp-api-fetch', 'registered') || wp_script_is('wp-api-fetch', 'enqueued')) {
            wp_localize_script('wp-api-fetch', 'blognexaBootConfig', $bootConfig);
        }
    }
}

