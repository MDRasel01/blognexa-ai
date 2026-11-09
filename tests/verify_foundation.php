<?php
/**
 * BlogNexa AI - Foundation Verification Test Runner
 */

declare(strict_types=1);

// Mock WordPress Minimal Environment for Offline Verification
if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/../');
}

// Global mocks
global $wpdb, $wp_version;
$wp_version = '6.7';

class MockWPDB {
    public string $prefix = 'wp_';
    public function get_charset_collate(): string {
        return 'DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci';
    }
    public function db_version(): string {
        return '10.6.18-MariaDB';
    }
}
$wpdb = new MockWPDB();

function esc_html__(string $text, string $domain): string { return $text; }
function __(string $text, string $domain): string { return $text; }
function esc_html(string $text): string { return htmlspecialchars($text, ENT_QUOTES, 'UTF-8'); }
function sanitize_text_field(string $str): string { return strip_tags(trim($str)); }
function sanitize_key(string $key): string { return strtolower(preg_replace('/[^a-z0-9_\-]/i', '', $key)); }
function is_user_logged_in(): bool { return true; }
function current_user_can(string $cap): bool { return true; }
function wp_create_nonce(string $action): string { return md5($action . 'test_salt'); }
function wp_verify_nonce(string $nonce, string $action): bool { return $nonce === md5($action . 'test_salt'); }
function add_action(...$args): void {}
function add_filter(...$args): void {}
function do_action(...$args): void {}
function update_option(...$args): void {}
function get_option(string $opt, $default = false) { return $default; }
function delete_option(...$args): void {}
function set_transient(...$args): void {}
function delete_transient(...$args): void {}
function register_activation_hook(...$args): void {}
function register_deactivation_hook(...$args): void {}
function dbDelta(string $sql): array { return ['success']; }

// Load plugin constants & autoloader
require_once __DIR__ . '/../config/constants.php';

spl_autoload_register(static function (string $class): void {
    $prefix = 'BlogNexaAI\\';
    $baseDir = __DIR__ . '/../app/';

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

// Run Verifications
echo "=== BlogNexa AI Foundation Verification ===" . PHP_EOL;

// 1. Check Container
$container = new \BlogNexaAI\Core\Container();
$container->singleton('test_service', function () {
    return (object) ['name' => 'BlogNexaContainerTest'];
});
assert($container->get('test_service')->name === 'BlogNexaContainerTest');
echo "[PASS] Container Dependency Injection works." . PHP_EOL;

// 2. Check Capabilities
$caps = \BlogNexaAI\Security\CapabilityManager::ALL_CAPABILITIES;
assert(count($caps) === 13);
echo "[PASS] 13 Granular Capabilities registered correctly." . PHP_EOL;

// 3. Check Schemas
$queries = \BlogNexaAI\Database\Schema::getTableDefinitions();
assert(count($queries) === 4);
assert(str_contains($queries[0], 'wp_bnx_connections'));
assert(str_contains($queries[1], 'wp_bnx_jobs'));
assert(str_contains($queries[2], 'wp_bnx_publications'));
assert(str_contains($queries[3], 'wp_bnx_audit'));
echo "[PASS] 4 Custom Database Table Schemas defined with indexes." . PHP_EOL;

// 4. Check Module Loader
$moduleLoader = new \BlogNexaAI\Core\ModuleLoader($container);
$moduleLoader->load();
$loadedModules = $moduleLoader->getModules();
assert(count($loadedModules) === 11);
echo "[PASS] All 11 Product Modules loaded cleanly." . PHP_EOL;

// 5. Check Nonce Manager
$nonce = \BlogNexaAI\Security\NonceManager::createRestNonce();
assert(\BlogNexaAI\Security\NonceManager::verifyRestNonce($nonce) === true);
echo "[PASS] NonceManager verification passes." . PHP_EOL;

// 6. Check Input Validator
assert(\BlogNexaAI\Security\InputValidator::sanitizeText("<b>Hello</b> ") === "Hello");
assert(\BlogNexaAI\Security\InputValidator::isValidUuid("123e4567-e89b-42d3-a456-426614174000") === true);
assert(\BlogNexaAI\Security\InputValidator::isValidUuid("invalid-uuid") === false);
echo "[PASS] InputValidator sanitization & validation passes." . PHP_EOL;

echo "=== ALL FOUNDATION TESTS PASSED (6/6) ===" . PHP_EOL;

