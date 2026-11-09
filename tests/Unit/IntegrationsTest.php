<?php
/**
 * BlogNexa AI - Integrations & Post Types Unit Tests
 *
 * @package BlogNexaAI\Tests\Unit
 */

declare(strict_types=1);

namespace BlogNexaAI\Tests\Unit;

use BlogNexaAI\Integrations\SEODetector;
use BlogNexaAI\Integrations\PostTypeManager;

final class IntegrationsTest
{
    public static function run(): array
    {
        $results = [];

        // 1. SEODetector detects all 3 plugins (Rank Math, Yoast, AIOSEO)
        $seoData = SEODetector::detectAll();
        $results[] = [
            'name'   => 'SEODetector detects exactly 3 supported SEO plugins',
            'passed' => isset($seoData['providers']) && count($seoData['providers']) === 3,
        ];

        // 2. Verified zero API keys requirement in detection metadata
        $hasAnyApiKeyField = false;
        foreach ($seoData['providers'] as $plugin) {
            if (isset($plugin['api_key']) || isset($plugin['requires_key'])) {
                $hasAnyApiKeyField = true;
            }
        }
        $results[] = [
            'name'   => 'SEO plugins require zero external API keys',
            'passed' => $hasAnyApiKeyField === false,
        ];

        // 3. Supported plugin keys
        $pluginKeys = array_column(array_values($seoData['providers']), 'id');
        $results[] = [
            'name'   => 'SEODetector covers Rank Math, Yoast, and AIOSEO keys',
            'passed' => in_array('rankmath', $pluginKeys, true) &&
                        in_array('yoast', $pluginKeys, true) &&
                        in_array('aioseo', $pluginKeys, true),
        ];

        // 4. Primary SEO provider resolution
        $setPrimary = SEODetector::setPrimaryProvider('rankmath');
        $primary = SEODetector::getPrimaryProvider();
        $results[] = [
            'name'   => 'SEODetector correctly manages primary SEO provider',
            'passed' => $setPrimary === true && $primary === 'rankmath',
        ];

        // 5. PostTypeManager discovers post types
        $postTypes = PostTypeManager::discoverPostTypes();
        $results[] = [
            'name'   => 'PostTypeManager discovers registered post types',
            'passed' => is_array($postTypes) && !empty($postTypes),
        ];

        // 6. PostTypeManager manages enabled post types whitelist
        PostTypeManager::setEnabledPostTypes(['post', 'page']);
        $enabled = PostTypeManager::getEnabledPostTypes();
        $results[] = [
            'name'   => 'PostTypeManager stores and retrieves enabled post types',
            'passed' => in_array('post', $enabled, true) && in_array('page', $enabled, true) && PostTypeManager::isTypeEnabled('post'),
        ];

        return $results;
    }
}
