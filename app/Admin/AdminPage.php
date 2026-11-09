<?php
/**
 * BlogNexa AI - Admin Page Renderer
 *
 * @package BlogNexaAI\Admin
 */

declare(strict_types=1);

namespace BlogNexaAI\Admin;

use BlogNexaAI\Security\PermissionManager;

if (!defined('ABSPATH')) {
    exit;
}

final class AdminPage
{
    /**
     * Render the admin page markup.
     */
    public static function render(): void
    {
        if (!PermissionManager::can(BLOGNEXA_CAP_ACCESS)) {
            wp_die(
                esc_html__('You do not have sufficient permissions to access BlogNexa AI.', 'blognexa-ai'),
                esc_html__('Permission Denied', 'blognexa-ai'),
                ['response' => 403]
            );
        }

        ?>
        <div class="wrap blognexa-admin-wrap">
            <h1 class="wp-heading-inline screen-reader-text"><?php esc_html_e('BlogNexa AI', 'blognexa-ai'); ?></h1>
            <div id="blognexa-ai-admin">
                <div class="blognexa-skeleton-loading" style="padding: 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;">
                    <div class="spinner is-active" style="float: none; margin: 0 auto 16px;"></div>
                    <p style="font-size: 15px; color: #4a5568;"><?php esc_html_e('Loading BlogNexa AI Workspace...', 'blognexa-ai'); ?></p>
                </div>
            </div>
        </div>
        <?php
    }
}
