<?php
/**
 * BlogNexa AI - Integration Test Suite (Lifecycle, Database & REST API)
 */

declare(strict_types=1);

namespace BlogNexaAI\Tests\Integration;

use BlogNexaAI\Lifecycle\Activator;
use BlogNexaAI\Lifecycle\Deactivator;
use BlogNexaAI\Lifecycle\Uninstaller;
use BlogNexaAI\Database\Installer;
use BlogNexaAI\Database\Migrator;
use BlogNexaAI\API\Controllers\StatusController;
use BlogNexaAI\API\Controllers\SettingsController;
use BlogNexaAI\API\RESTRegistrar;
use WP_REST_Request;

final class LifecycleAndApiTest
{
    public static function run(): array
    {
        global $test_options, $test_roles, $current_test_user_caps, $test_registered_routes;
        $results = [];

        // 1. Activation
        Activator::activate();
        $results['Activator sets DB version option'] = (get_option(Installer::DB_VERSION_OPTION) === BLOGNEXA_DB_VERSION);
        $results['Activator initializes default settings'] = !empty(get_option(Installer::SETTINGS_OPTION));
        $results['Activator assigns capabilities to admin role'] = ($test_roles['administrator']->has_cap(BLOGNEXA_CAP_ACCESS) === true);

        // 2. Reactivation safety
        Activator::activate();
        $results['Reactivation is safe and idempotent'] = (get_option(Installer::DB_VERSION_OPTION) === BLOGNEXA_DB_VERSION);

        // 3. Deactivation preserves data
        Deactivator::deactivate();
        $results['Deactivator preserves settings option'] = !empty(get_option(Installer::SETTINGS_OPTION));
        $results['Deactivator preserves DB version'] = (get_option(Installer::DB_VERSION_OPTION) === BLOGNEXA_DB_VERSION);

        // 4. Uninstall with default policy (preserves data)
        Uninstaller::uninstall();
        $results['Uninstall without purge preserves settings'] = !empty(get_option(Installer::SETTINGS_OPTION));

        // 5. REST Route Registration
        $registrar = new RESTRegistrar();
        $registrar->registerRoutes();
        $results['RESTRegistrar registers /status'] = isset($test_registered_routes['blognexa/v1/status']);
        $results['RESTRegistrar registers /settings'] = isset($test_registered_routes['blognexa/v1/settings']);

        // 6. Settings Retrieval Controller
        $settingsController = new SettingsController();
        $request = new WP_REST_Request([]);
        $response = $settingsController->getSettings($request);
        $results['SettingsController returns safe whitelisted settings'] = ($response->get_status() === 200 && isset($response->get_data()['data']['writing_language']));

        // 7. Settings Update Controller with Valid Data
        $updateRequest = new WP_REST_Request([
            'writing_language' => 'bn_BD',
            'content_quality_threshold' => 85,
        ]);
        $updateResponse = $settingsController->updateSettings($updateRequest);
        $results['SettingsController updates valid whitelisted settings'] = ($updateResponse->get_status() === 200);

        // 8. Settings Update Rejects Unknown Fields
        $badRequest = new WP_REST_Request([
            'malicious_arbitrary_key' => 'evil_value',
        ]);
        $badResponse = $settingsController->updateSettings($badRequest);
        $results['SettingsController rejects non-whitelisted field'] = (is_wp_error($badResponse) && $badResponse->get_error_code() === 'blognexa_unknown_setting');

        // 9. Crawler Controller Route Registration
        $results['RESTRegistrar registers /crawler/scan'] = isset($test_registered_routes['blognexa/v1/crawler/scan']);
        $results['RESTRegistrar registers /crawler/status'] = isset($test_registered_routes['blognexa/v1/crawler/status']);
        $results['RESTRegistrar registers /crawler/urls'] = isset($test_registered_routes['blognexa/v1/crawler/urls']);
        $results['RESTRegistrar registers /crawler/documents'] = isset($test_registered_routes['blognexa/v1/crawler/documents']);
        $results['RESTRegistrar registers /crawler/cancel'] = isset($test_registered_routes['blognexa/v1/crawler/cancel']);

        return $results;
    }
}

