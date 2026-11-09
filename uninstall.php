<?php
/**
 * BlogNexa AI - Plugin Uninstaller
 *
 * @package BlogNexaAI
 */

declare(strict_types=1);

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

require_once __DIR__ . '/config/constants.php';

$composerAutoload = __DIR__ . '/vendor/autoload.php';
if (file_exists($composerAutoload)) {
    require_once $composerAutoload;
} else {
    require_once __DIR__ . '/app/Security/CapabilityManager.php';
    require_once __DIR__ . '/app/Lifecycle/Uninstaller.php';
}

\BlogNexaAI\Lifecycle\Uninstaller::uninstall();
