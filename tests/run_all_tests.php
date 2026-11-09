<?php
/**
 * BlogNexa AI - Unified Automated Test Suite Runner (Step 01 & Step 02)
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/Unit/CoreAndSecurityTest.php';
require_once __DIR__ . '/Integration/LifecycleAndApiTest.php';
require_once __DIR__ . '/Security/SecurityScenarioTest.php';

use BlogNexaAI\Tests\Unit\CoreAndSecurityTest;
use BlogNexaAI\Tests\Integration\LifecycleAndApiTest;
use BlogNexaAI\Tests\Security\SecurityScenarioTest;

echo PHP_EOL . "==========================================================" . PHP_EOL;
echo " BLOGNEXA AI — STEP 01 + STEP 02 UNIFIED TEST SUITE" . PHP_EOL;
echo "==========================================================" . PHP_EOL . PHP_EOL;

$allSuites = [
    'Unit Tests'        => CoreAndSecurityTest::run(),
    'Integration Tests' => LifecycleAndApiTest::run(),
    'Security Tests'    => SecurityScenarioTest::run(),
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

