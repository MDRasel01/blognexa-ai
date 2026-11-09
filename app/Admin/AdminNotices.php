<?php
/**
 * BlogNexa AI - Admin Notices Manager
 *
 * @package BlogNexaAI\Admin
 */

declare(strict_types=1);

namespace BlogNexaAI\Admin;

use BlogNexaAI\Core\Requirements;

if (!defined('ABSPATH')) {
    exit;
}

final class AdminNotices
{
    /**
     * Register notices hook.
     */
    public function register(): void
    {
        add_action('admin_notices', [$this, 'renderNotices']);
    }

    /**
     * Render active admin notices.
     */
    public function renderNotices(): void
    {
        // 1. Requirements failure notice
        if (!Requirements::check()) {
            Requirements::renderNotice();
            return;
        }

        // 2. Transients notices (e.g., successful migration or activation alert)
        $notice = get_transient('blognexa_admin_notice');
        if ($notice && is_array($notice)) {
            $type = esc_attr($notice['type'] ?? 'info');
            $message = esc_html($notice['message'] ?? '');
            printf(
                '<div class="notice notice-%s is-dismissible"><p><strong>%s</strong> %s</p></div>',
                $type,
                esc_html__('BlogNexa AI:', 'blognexa-ai'),
                $message
            );
            delete_transient('blognexa_admin_notice');
        }
    }

    /**
     * Flash an admin notice for the next request.
     *
     * @param string $message
     * @param string $type ('error'|'warning'|'success'|'info')
     */
    public static function flash(string $message, string $type = 'info'): void
    {
        set_transient('blognexa_admin_notice', [
            'message' => $message,
            'type'    => $type,
        ], 30);
    }
}

