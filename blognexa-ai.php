<?php
/**
 * Plugin Name:       BlogNexa AI
 * Plugin URI:        https://blognexa.ai
 * Description:       AI-powered WordPress content intelligence and blog automation platform.
 * Version:           1.0.0
 * Requires at least: 6.2
 * Requires PHP:      8.1
 * Author:            BlogNexa Engineering Team
 * Author URI:        https://blognexa.ai
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       blognexa-ai
 * Domain Path:       /languages
 *
 * @package BlogNexaAI
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

// Load Constants
require_once __DIR__ . '/config/constants.php';

// Composer Autoloader or Built-in PSR-4 Fallback
$composerAutoload = __DIR__ . '/vendor/autoload.php';
if (file_exists($composerAutoload)) {
    require_once $composerAutoload;
} else {
    // Development/Fallback PSR-4 Autoloader
    spl_autoload_register(static function (string $class): void {
        $prefix = 'BlogNexaAI\\';
        $baseDir = __DIR__ . '/app/';

        $len = strlen($prefix);
        if (strncmp($prefix, $class, $len) !== 0) {
            return;
        }

        $relativeClass = substr($class, $len);
        $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

        if (file_exists($file)) {
            require_once $file;
        }
    });
}

// Runtime Requirements Verification
if (!\BlogNexaAI\Core\Requirements::check()) {
    add_action('admin_notices', [\BlogNexaAI\Core\Requirements::class, 'renderNotice']);
    return;
}

// Register Activation & Deactivation Lifecycle Hooks
register_activation_hook(
    __FILE__,
    [\BlogNexaAI\Lifecycle\Activator::class, 'activate']
);

register_deactivation_hook(
    __FILE__,
    [\BlogNexaAI\Lifecycle\Deactivator::class, 'deactivate']
);

// Bootstrap the Plugin Application
add_action('plugins_loaded', static function (): void {
    \BlogNexaAI\Core\Plugin::instance()->boot();
});
