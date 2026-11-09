<?php
/**
 * BlogNexa AI - Unified Automated Test Suite Runner (Steps 01, 02 & 04)
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/Unit/CoreAndSecurityTest.php';
require_once __DIR__ . '/Integration/LifecycleAndApiTest.php';
require_once __DIR__ . '/Security/SecurityScenarioTest.php';
require_once __DIR__ . '/Security/SiteIdentityTest.php';
require_once __DIR__ . '/Security/CredentialStoreTest.php';
require_once __DIR__ . '/Security/RequestSignerTest.php';
require_once __DIR__ . '/Security/ConnectionStateMachineTest.php';
require_once __DIR__ . '/Unit/AIFactoryTest.php';

use BlogNexaAI\Tests\Unit\CoreAndSecurityTest;
use BlogNexaAI\Tests\Unit\AIFactoryTest;
use BlogNexaAI\Tests\Integration\LifecycleAndApiTest;
use BlogNexaAI\Tests\Security\SecurityScenarioTest;
use BlogNexaAI\Tests\Security\SiteIdentityTest;
use BlogNexaAI\Tests\Security\CredentialStoreTest;
use BlogNexaAI\Tests\Security\RequestSignerTest;
use BlogNexaAI\Tests\Security\ConnectionStateMachineTest;

echo PHP_EOL . "==========================================================" . PHP_EOL;
echo " BLOGNEXA AI — STEPS 01, 02 & 04 UNIFIED TEST SUITE" . PHP_EOL;
echo "==========================================================" . PHP_EOL . PHP_EOL;

// Convert list-of-dicts format to associative format for standard reporter
$formatSuite = function(array $items): array {
    $formatted = [];
    foreach ($items as $item) {
        if (isset($item['name']) && isset($item['passed'])) {
            $formatted[$item['name']] = (bool) $item['passed'];
        }
    }
    return $formatted;
};

$allSuites = [
    'Unit Tests'                         => CoreAndSecurityTest::run(),
    'Integration Tests'                  => LifecycleAndApiTest::run(),
    'Security Tests'                     => SecurityScenarioTest::run(),
    'Step 04: Site Identity'             => $formatSuite(SiteIdentityTest::run()),
    'Step 04: Credential Store'          => $formatSuite(CredentialStoreTest::run()),
    'Step 04: HMAC Request Signing'      => $formatSuite(RequestSignerTest::run()),
    'Step 04: Connection State Machine'  => $formatSuite(ConnectionStateMachineTest::run()),
    'Standalone AI & Native Crawler'     => $formatSuite(AIFactoryTest::run()),
];

$totalTests = 0;
$totalPassed = 0;
$totalFailed = 0;

foreach ($allSuites as $suiteName => $tests) {
    echo "--- {$suiteName} ---" . PHP_EOL;
    foreach ($tests as $testName => $passed) {
        $totalTests++;
        if ($passed) {
            $totalPassed++;
            echo "  [PASS] {$testName}" . PHP_EOL;
        } else {
            $totalFailed++;
            echo "  [FAIL] {$testName}" . PHP_EOL;
        }
    }
    echo PHP_EOL;
}

echo "==========================================================" . PHP_EOL;
echo " TEST SUMMARY" . PHP_EOL;
echo "==========================================================" . PHP_EOL;
echo " Total Tests  : {$totalTests}" . PHP_EOL;
echo " Passed       : {$totalPassed}" . PHP_EOL;
echo " Failed       : {$totalFailed}" . PHP_EOL;
echo " Blocked      : 0" . PHP_EOL;
echo " Not Run      : 0" . PHP_EOL;
echo " Result       : " . ($totalFailed === 0 ? "SUCCESS (ALL TESTS PASSED)" : "FAILURE") . PHP_EOL;
echo "==========================================================" . PHP_EOL . PHP_EOL;

exit($totalFailed === 0 ? 0 : 1);
