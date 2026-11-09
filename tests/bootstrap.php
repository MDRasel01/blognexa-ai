<?php
/**
 * BlogNexa AI - Test Suite Bootstrap
 *
 * @package BlogNexaAI\Tests
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    define('ABSPATH', dirname(__DIR__) . '/');
}

if (!class_exists('WP_REST_Controller')) {
    abstract class WP_REST_Controller {}
}

// Global mocks
global $wpdb, $wp_version, $current_user, $test_options, $test_transients, $test_actions, $test_filters, $test_roles, $test_registered_routes;

$wp_version = '6.7';
$test_options = [];
$test_transients = [];
$test_actions = [];
$test_filters = [];
$test_registered_routes = [];
$test_roles = [
    'administrator' => new class {
        public array $capabilities = [];
        public function add_cap(string $cap): void { $this->capabilities[$cap] = true; }
        public function remove_cap(string $cap): void { unset($this->capabilities[$cap]); }
        public function has_cap(string $cap): bool { return !empty($this->capabilities[$cap]); }
    },
    'editor' => new class {
        public array $capabilities = [];
        public function add_cap(string $cap): void { $this->capabilities[$cap] = true; }
        public function remove_cap(string $cap): void { unset($this->capabilities[$cap]); }
        public function has_cap(string $cap): bool { return !empty($this->capabilities[$cap]); }
    },
    'author' => new class {
        public array $capabilities = [];
        public function add_cap(string $cap): void { $this->capabilities[$cap] = true; }
        public function remove_cap(string $cap): void { unset($this->capabilities[$cap]); }
        public function has_cap(string $cap): bool { return !empty($this->capabilities[$cap]); }
    },
];

class MockWPDB
{
    public string $prefix = 'wp_';
    public array $queries = [];
    public array $inserted_rows = [];

    public function get_charset_collate(): string
    {
        return 'DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci';
    }

    public function db_version(): string
    {
        return '10.6.18-MariaDB';
    }

    public function query(string $sql): int|bool
    {
        $this->queries[] = $sql;
        return 1;
    }

    public function insert(string $table, array $data, array $format = []): int|bool
    {
        $this->inserted_rows[] = ['table' => $table, 'data' => $data];
        return 1;
    }

    public function get_row(string $query = null, string $output = 'OBJECT', int $y = 0)
    {
        return null;
    }

    public function get_results(string $query = null, string $output = 'OBJECT')
    {
        return [];
    }

    public function prepare(string $query, ...$args): string
    {
        return vsprintf(str_replace('%s', "'%s'", str_replace('%d', '%d', $query)), $args);
    }
}

$wpdb = new MockWPDB();

// Minimal WordPress API Mocks for offline test runner
if (!function_exists('esc_html__')) {
    function esc_html__(string $t, string $d = ''): string { return $t; }
}
if (!function_exists('__')) {
    function __(string $t, string $d = ''): string { return $t; }
}
if (!function_exists('esc_html')) {
    function esc_html(string $t): string { return htmlspecialchars($t, ENT_QUOTES, 'UTF-8'); }
}
if (!function_exists('esc_attr')) {
    function esc_attr(string $t): string { return htmlspecialchars($t, ENT_QUOTES, 'UTF-8'); }
}
if (!function_exists('esc_url_raw')) {
    function esc_url_raw(string $url): string { return filter_var($url, FILTER_SANITIZE_URL) ?: ''; }
}
if (!function_exists('sanitize_text_field')) {
    function sanitize_text_field(string $str): string { return strip_tags(trim($str)); }
}
if (!function_exists('sanitize_key')) {
    function sanitize_key(string $key): string { return strtolower(preg_replace('/[^a-z0-9_\-]/i', '', $key)); }
}
if (!function_exists('absint')) {
    function absint($maybeint): int { return abs((int) $maybeint); }
}
if (!function_exists('is_user_logged_in')) {
    function is_user_logged_in(): bool {
        global $current_test_user_logged_in;
        return $current_test_user_logged_in ?? true;
    }
}
if (!function_exists('current_user_can')) {
    function current_user_can(string $capability): bool {
        global $current_test_user_caps;
        return !empty($current_test_user_caps[$capability]);
    }
}
if (!function_exists('get_current_user_id')) {
    function get_current_user_id(): int { return 1; }
}
if (!function_exists('get_role')) {
    function get_role(string $role) {
        global $test_roles;
        return $test_roles[$role] ?? null;
    }
}
if (!function_exists('update_option')) {
    function update_option(string $key, $value, $autoload = null): bool {
        global $test_options;
        $test_options[$key] = $value;
        return true;
    }
}
if (!function_exists('get_option')) {
    function get_option(string $key, $default = false) {
        global $test_options;
        return $test_options[$key] ?? $default;
    }
}
if (!function_exists('delete_option')) {
    function delete_option(string $key): bool {
        global $test_options;
        unset($test_options[$key]);
        return true;
    }
}
if (!function_exists('set_transient')) {
    function set_transient(string $t, $v, int $exp = 0): bool {
        global $test_transients;
        $test_transients[$t] = $v;
        return true;
    }
}
if (!function_exists('get_transient')) {
    function get_transient(string $t) {
        global $test_transients;
        return $test_transients[$t] ?? false;
    }
}
if (!function_exists('delete_transient')) {
    function delete_transient(string $t): bool {
        global $test_transients;
        unset($test_transients[$t]);
        return true;
    }
}
if (!function_exists('wp_clear_scheduled_hook')) {
    function wp_clear_scheduled_hook(string $hook): void {}
}
if (!function_exists('wp_create_nonce')) {
    function wp_create_nonce(string $action): string { return hash('sha256', $action . 'wp_test_salt'); }
}
if (!function_exists('wp_verify_nonce')) {
    function wp_verify_nonce(string $nonce, string $action): bool { return $nonce === hash('sha256', $action . 'wp_test_salt'); }
}
if (!function_exists('add_action')) {
    function add_action(string $hook, $cb, int $p = 10, int $args = 1): void {
        global $test_actions;
        $test_actions[$hook][] = $cb;
    }
}
if (!function_exists('add_filter')) {
    function add_filter(string $hook, $cb, int $p = 10, int $args = 1): void {
        global $test_filters;
        $test_filters[$hook][] = $cb;
    }
}
if (!function_exists('do_action')) {
    function do_action(string $hook, ...$args): void {}
}
if (!function_exists('current_time')) {
    function current_time(string $type, int $gmt = 0): string { return gmdate('Y-m-d H:i:s'); }
}
if (!function_exists('wp_json_encode')) {
    function wp_json_encode($data): string { return json_encode($data) ?: ''; }
}
if (!function_exists('wp_parse_url')) {
    function wp_parse_url(string $url) { return parse_url($url); }
}
if (!function_exists('register_activation_hook')) {
    function register_activation_hook(...$args): void {}
}
if (!function_exists('register_deactivation_hook')) {
    function register_deactivation_hook(...$args): void {}
}
if (!function_exists('dbDelta')) {
    function dbDelta(string $sql): array { return ['success']; }
}
if (!function_exists('deactivate_plugins')) {
    function deactivate_plugins($plugins): void {}
}
if (!function_exists('plugin_basename')) {
    function plugin_basename(string $file): string { return basename(dirname($file)) . '/' . basename($file); }
}
if (!function_exists('wp_die')) {
    function wp_die(string $msg = '', string $title = '', array $args = []): void {
        throw new \RuntimeException($msg);
    }
}
if (!function_exists('home_url')) {
    function home_url(string $path = ''): string { return 'https://example.com' . ($path ? '/' . ltrim($path, '/') : ''); }
}
if (!function_exists('site_url')) {
    function site_url(string $path = ''): string { return 'https://example.com' . ($path ? '/' . ltrim($path, '/') : ''); }
}
if (!function_exists('get_bloginfo')) {
    function get_bloginfo(string $show = ''): string {
        if ($show === 'name') return 'BlogNexa Test Site';
        if ($show === 'admin_email') return 'admin@example.com';
        return '';
    }
}
if (!function_exists('is_multisite')) {
    function is_multisite(): bool { return false; }
}

// WP_Error & WP_REST Mocks
class WP_Error
{
    private string $code;
    private string $message;
    private mixed $data;

    public function __construct(string $code = '', string $message = '', mixed $data = null)
    {
        $this->code = $code;
        $this->message = $message;
        $this->data = $data;
    }

    public function get_error_code(): string { return $this->code; }
    public function get_error_message(): string { return $this->message; }
    public function get_error_data(): mixed { return $this->data; }
}

if (!function_exists('is_wp_error')) {
    function is_wp_error($thing): bool { return $thing instanceof WP_Error; }
}

class WP_REST_Response
{
    public mixed $data;
    public int $status;

    public function __construct(mixed $data = null, int $status = 200)
    {
        $this->data = $data;
        $this->status = $status;
    }

    public function get_data(): mixed { return $this->data; }
    public function get_status(): int { return $this->status; }
}

class WP_REST_Request
{
    private array $json_params = [];
    public function __construct(array $params = []) { $this->json_params = $params; }
    public function get_json_params(): array { return $this->json_params; }
}

class WP_REST_Server
{
    public const READABLE = 'GET';
    public const CREATABLE = 'POST';
}

if (!function_exists('register_rest_route')) {
    function register_rest_route(string $ns, string $route, array $args): void {
        global $test_registered_routes;
        $test_registered_routes[$ns . $route] = $args;
    }
}

// Load constants & fallback autoloader
require_once dirname(__DIR__) . '/config/constants.php';

spl_autoload_register(static function (string $class): void {
    $prefix = 'BlogNexaAI\\';
    $baseDir = dirname(__DIR__) . '/app/';

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
