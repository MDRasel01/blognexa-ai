<?php
/**
 * BlogNexa AI - Site Identity Unit Tests
 *
 * @package BlogNexaAI\Tests\Security
 */

declare(strict_types=1);

namespace BlogNexaAI\Tests\Security;

use BlogNexaAI\Security\SiteIdentity;

final class SiteIdentityTest
{
    public static function run(): array
    {
        $results = [];

        // Test 1: UUIDv4 format and generation
        $id1 = SiteIdentity::getSiteInstanceId();
        $isUuid = SiteIdentity::isValidUuidV4($id1);
        $results[] = [
            'name'   => 'SiteIdentity generates valid UUIDv4',
            'passed' => $isUuid,
            'detail' => "Generated: {$id1}",
        ];

        // Test 2: Persistence (subsequent calls return same UUID)
        $id2 = SiteIdentity::getSiteInstanceId();
        $results[] = [
            'name'   => 'SiteIdentity persists and returns identical UUID',
            'passed' => $id1 === $id2,
            'detail' => "id1={$id1}, id2={$id2}",
        ];

        // Test 3: Clone / URL change detection
        SiteIdentity::markRegistered('https://old-registered-domain.com');
        // home_url in mock is https://example.com, which differs from old-registered-domain.com
        $isCloned = SiteIdentity::isCloneOrUrlChanged();
        $results[] = [
            'name'   => 'SiteIdentity detects URL change / staging clone',
            'passed' => $isCloned === true,
            'detail' => 'Detected mismatch between registered and current URL',
        ];

        // Test 4: Mark registered with matching URL
        SiteIdentity::markRegistered(home_url());
        $isMatch = !SiteIdentity::isCloneOrUrlChanged();
        $results[] = [
            'name'   => 'SiteIdentity confirms valid matching URL',
            'passed' => $isMatch,
            'detail' => 'home_url matches registered URL',
        ];

        // Test 5: Metadata array structure
        $meta = SiteIdentity::getSiteMetadata();
        $hasMetaKeys = isset($meta['site_instance_id'], $meta['site_url'], $meta['admin_email_hash'], $meta['php_version']);
        $results[] = [
            'name'   => 'SiteIdentity provides complete site metadata bundle',
            'passed' => $hasMetaKeys,
            'detail' => 'All required metadata keys present',
        ];

        return $results;
    }
}
