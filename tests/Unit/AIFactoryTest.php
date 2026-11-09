<?php
/**
 * BlogNexa AI - Direct AI & Native Crawler Unit Tests
 *
 * @package BlogNexaAI\Tests\Unit
 */

declare(strict_types=1);

namespace BlogNexaAI\Tests\Unit;

use BlogNexaAI\Infrastructure\AI\AIFactory;
use BlogNexaAI\Infrastructure\AI\GeminiClient;
use BlogNexaAI\Infrastructure\AI\OpenAIClient;
use BlogNexaAI\Modules\WebsiteIntelligence\NativeCrawler;

final class AIFactoryTest
{
    public static function run(): array
    {
        $results = [];

        // 1. Initial config returns unconfigured defaults
        $config = AIFactory::getConfig();
        $results[] = [
            'name'   => 'AIFactory returns safe default configuration',
            'passed' => isset($config['provider']) && $config['provider'] === 'gemini',
        ];

        // 2. Saving and masking API keys
        AIFactory::saveConfig([
            'provider'       => 'gemini',
            'gemini_api_key' => 'AIzaSyTestSecret1234567890Key',
            'gemini_model'   => 'gemini-1.5-flash',
        ]);

        $public = AIFactory::getPublicConfig();
        $results[] = [
            'name'   => 'AIFactory masks sensitive API key',
            'passed' => $public['has_gemini_key'] === true && str_contains($public['gemini_api_key'], '••••'),
        ];

        // 3. Factory returns GeminiClient
        $client = AIFactory::getClient('gemini');
        $results[] = [
            'name'   => 'AIFactory instantiates GeminiClient with active key',
            'passed' => $client instanceof GeminiClient && $client->getProviderName() === 'gemini',
        ];

        // 4. Factory returns error when OpenAI key missing
        $openAIClient = AIFactory::getClient('openai');
        $results[] = [
            'name'   => 'AIFactory safely returns WP_Error when OpenAI key missing',
            'passed' => is_wp_error($openAIClient) && $openAIClient->get_error_code() === 'missing_key',
        ];

        // 5. NativeCrawler state initialization
        $crawlerState = NativeCrawler::getState();
        $results[] = [
            'name'   => 'NativeCrawler provides default state structure',
            'passed' => isset($crawlerState['status']) && isset($crawlerState['total_discovered']),
        ];

        return $results;
    }
}

