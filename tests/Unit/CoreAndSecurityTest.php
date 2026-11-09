<?php
/**
 * BlogNexa AI - Unit Test Suite (Core & Security Components)
 */

declare(strict_types=1);

namespace BlogNexaAI\Tests\Unit;

use BlogNexaAI\Core\Requirements;
use BlogNexaAI\Core\Container;
use BlogNexaAI\Core\ModuleLoader;
use BlogNexaAI\Security\CapabilityManager;
use BlogNexaAI\Security\PermissionManager;
use BlogNexaAI\Security\NonceManager;
use BlogNexaAI\Security\InputValidator;
use BlogNexaAI\Security\SecretManager;
use BlogNexaAI\Database\Schema;
use BlogNexaAI\API\Responses\APIResponse;
use BlogNexaAI\Infrastructure\HTTP\WordPressHTTPClient;

final class CoreAndSecurityTest
{
    public static function run(): array
    {
        $results = [];

        // Test 1: Requirements Checker
        $results['Requirements::check() on current runtime'] = Requirements::check();

        // Test 2: Container DI & Singletons
        $container = new Container();
        $container->singleton('test_service', function () {
            return (object) ['key' => 'blognexa_test'];
        });
        $results['Container singleton resolution'] = ($container->get('test_service')->key === 'blognexa_test');

        // Test 3: Module Loader
        $moduleLoader = new ModuleLoader($container);
        $moduleLoader->load();
        $results['ModuleLoader loads all 11 modules'] = (count($moduleLoader->getModules()) === 11);

        // Test 4: Capability Manager
        $results['CapabilityManager has 13 capabilities'] = (count(CapabilityManager::ALL_CAPABILITIES) === 13);

        // Test 5: Permission Manager access check
        global $current_test_user_caps;
        $current_test_user_caps = [BLOGNEXA_CAP_ACCESS => true];
        $results['PermissionManager validates granted capability'] = (PermissionManager::can(BLOGNEXA_CAP_ACCESS) === true);
        $results['PermissionManager rejects missing capability'] = (PermissionManager::can(BLOGNEXA_CAP_MANAGE_SETTINGS) === false);

        // Test 6: Nonce Manager
        $nonce = NonceManager::createRestNonce();
        $results['NonceManager creates and verifies nonce'] = NonceManager::verifyRestNonce($nonce);
        $results['NonceManager rejects invalid nonce'] = !NonceManager::verifyRestNonce('invalid_nonce_token');

        // Test 7: Input Validator
        $cleanHtml = InputValidator::sanitizeText('<script>alert(1)</script>text');
        $results['InputValidator sanitizes HTML'] = ($cleanHtml === 'text');
        $results['InputValidator validates UUIDv4'] = InputValidator::isValidUuid('c9bf9e57-1685-4c89-bafb-ff5af830be8a');
        $results['InputValidator rejects bad UUID'] = !InputValidator::isValidUuid('invalid-uuid-string');

        // Test 8: Secret Manager Encryption / Decryption / Redaction
        $secret = 'super_secret_ai_token_12345';
        $encrypted = SecretManager::encrypt($secret);
        $decrypted = SecretManager::decrypt($encrypted);
        $redacted = SecretManager::redact($secret);
        $results['SecretManager encrypts and decrypts with HMAC'] = ($decrypted === $secret);
        $results['SecretManager redacts secret correctly'] = (str_starts_with($redacted, 'supe') && str_ends_with($redacted, '2345') && str_contains($redacted, '***'));

        // Test 9: Database Schemas
        $schemas = Schema::getTableDefinitions();
        $results['Schema defines 4 valid table queries'] = (count($schemas) === 4);

        // Test 10: API Response Normalization
        $response = APIResponse::success(['status' => 'ok']);
        $results['APIResponse formats success payload envelope'] = ($response->get_status() === 200 && $response->get_data()['success'] === true);

        // Test 11: HTTP Client SSRF Protection
        $httpClient = new WordPressHTTPClient();
        $ssrf1 = $httpClient->validateDestinationUrl('http://insecure-api.com');
        $ssrf2 = $httpClient->validateDestinationUrl('https://localhost/api');
        $ssrf3 = $httpClient->validateDestinationUrl('https://api.blognexa.ai');
        $results['HTTP Client blocks non-HTTPS'] = is_wp_error($ssrf1);
        $results['HTTP Client blocks localhost'] = is_wp_error($ssrf2);
        $results['HTTP Client allows public HTTPS domain'] = ($ssrf3 === true);

        return $results;
    }
}
