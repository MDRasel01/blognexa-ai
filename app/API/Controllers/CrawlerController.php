<?php
/**
 * BlogNexa AI - Crawler Management REST Controller
 *
 * @package BlogNexaAI\API\Controllers
 */

declare(strict_types=1);

namespace BlogNexaAI\API\Controllers;

use BlogNexaAI\API\Responses\ApiResponse;
use BlogNexaAI\Security\PermissionManager;
use BlogNexaAI\Security\SiteIdentity;
use BlogNexaAI\Security\CredentialStore;
use BlogNexaAI\Infrastructure\HTTP\WordPressHTTPClient;
use BlogNexaAI\Modules\WebsiteIntelligence\NativeCrawler;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if (!defined('ABSPATH')) {
    exit;
}

final class CrawlerController extends BaseController
{
    /**
     * Register endpoints.
     */
    public function register_routes(): void
    {
        // POST /wp-json/blognexa/v1/crawler/scan
        register_rest_route(
            $this->namespace,
            '/crawler/scan',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'startScan'],
                    'permission_callback' => [PermissionManager::class, 'checkScanWebsite'],
                ],
            ]
        );

        // GET /wp-json/blognexa/v1/crawler/status
        register_rest_route(
            $this->namespace,
            '/crawler/status',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getScanStatus'],
                    'permission_callback' => [PermissionManager::class, 'checkScanWebsite'],
                ],
            ]
        );

        // GET /wp-json/blognexa/v1/crawler/urls
        register_rest_route(
            $this->namespace,
            '/crawler/urls',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getDiscoveredUrls'],
                    'permission_callback' => [PermissionManager::class, 'checkScanWebsite'],
                ],
            ]
        );

        // GET /wp-json/blognexa/v1/crawler/documents
        register_rest_route(
            $this->namespace,
            '/crawler/documents',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [$this, 'getExtractedDocuments'],
                    'permission_callback' => [PermissionManager::class, 'checkScanWebsite'],
                ],
            ]
        );

        // POST /wp-json/blognexa/v1/crawler/cancel
        register_rest_route(
            $this->namespace,
            '/crawler/cancel',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [$this, 'cancelScan'],
                    'permission_callback' => [PermissionManager::class, 'checkScanWebsite'],
                ],
            ]
        );
    }

    /**
     * Start website crawling job on cloud backend.
     */
    public function startScan(WP_REST_Request $request): WP_REST_Response
    {
        if (!CredentialStore::hasCredentials()) {
            $scanResult = NativeCrawler::executeScan();
            return ApiResponse::success([
                'job_id'           => $scanResult['job_id'],
                'status'           => 'completed',
                'mode'             => 'standalone_native',
                'total_discovered' => $scanResult['total_discovered'],
                'total_processed'  => $scanResult['total_processed'],
                'total_words'      => $scanResult['total_words'],
                'duration_seconds' => $scanResult['duration_seconds'],
                'message'          => sprintf(__('Discovered & extracted %d pages (%d words) via Native WordPress Engine.', 'blognexa-ai'), $scanResult['total_processed'], $scanResult['total_words']),
            ]);
        }

        $siteId = SiteIdentity::getSiteInstanceId();
        $origin = home_url();

        $mode = sanitize_text_field((string) $request->get_param('scan_type'));
        if (!in_array($mode, ['full', 'incremental', 'targeted'], true)) {
            $mode = 'incremental';
        }

        $config = [
            'max_pages'         => (int) ($request->get_param('max_pages') ?: 100),
            'max_depth'         => (int) ($request->get_param('max_depth') ?: 3),
            'respect_robots'    => (bool) ($request->get_param('respect_robots') ?? true),
            'custom_exclusions' => array_filter(array_map('trim', explode(',', (string) ($request->get_param('exclude_patterns') ?: '')))),
        ];

        $client = new WordPressHTTPClient();
        $endpoint = "/v1/sites/{$siteId}/crawl-jobs";
        $payload = [
            'registered_origin' => $origin,
            'mode'              => $mode,
            'configuration'     => $config,
        ];

        $response = $client->post($endpoint, $payload);
        if (is_wp_error($response)) {
            return ApiResponse::error(
                $response->get_error_code(),
                $response->get_error_message(),
                502,
                $response->get_error_data()
            );
        }

        // Cache last job id
        if (isset($response['job_id'])) {
            update_option('blognexa_last_crawl_job_id', $response['job_id'], false);
        }

        return ApiResponse::success($response);
    }

    /**
     * Get current or last crawl job progress.
     */
    public function getScanStatus(WP_REST_Request $request): WP_REST_Response
    {
        if (!CredentialStore::hasCredentials()) {
            return ApiResponse::success(NativeCrawler::getState());
        }

        $siteId = SiteIdentity::getSiteInstanceId();
        $jobId = sanitize_text_field((string) $request->get_param('job_id'));
        if (empty($jobId)) {
            $jobId = (string) get_option('blognexa_last_crawl_job_id', '');
        }

        if (empty($jobId)) {
            return ApiResponse::success([
                'status'           => 'idle',
                'message'          => __('No crawl jobs have been initiated yet.', 'blognexa-ai'),
                'total_discovered' => 0,
                'total_processed'  => 0,
                'total_failed'     => 0,
            ]);
        }

        $client = new WordPressHTTPClient();
        $endpoint = "/v1/sites/{$siteId}/crawl-jobs/{$jobId}";
        $response = $client->get($endpoint);

        if (is_wp_error($response)) {
            return ApiResponse::error(
                $response->get_error_code(),
                $response->get_error_message(),
                502
            );
        }

        return ApiResponse::success($response);
    }

    /**
     * Get discovered URLs.
     */
    public function getDiscoveredUrls(WP_REST_Request $request): WP_REST_Response
    {
        if (!CredentialStore::hasCredentials()) {
            return ApiResponse::success([
                'urls' => NativeCrawler::getInventory()['urls'],
            ]);
        }

        $siteId = SiteIdentity::getSiteInstanceId();
        $client = new WordPressHTTPClient();
        $endpoint = "/v1/sites/{$siteId}/crawl-urls";

        $response = $client->get($endpoint);
        if (is_wp_error($response)) {
            return ApiResponse::error(
                $response->get_error_code(),
                $response->get_error_message(),
                502
            );
        }

        return ApiResponse::success($response);
    }

    /**
     * Get extracted documents.
     */
    public function getExtractedDocuments(WP_REST_Request $request): WP_REST_Response
    {
        if (!CredentialStore::hasCredentials()) {
            return ApiResponse::success([
                'documents' => NativeCrawler::getInventory()['documents'],
            ]);
        }

        $siteId = SiteIdentity::getSiteInstanceId();
        $client = new WordPressHTTPClient();
        $endpoint = "/v1/sites/{$siteId}/crawl-documents";

        $response = $client->get($endpoint);
        if (is_wp_error($response)) {
            return ApiResponse::error(
                $response->get_error_code(),
                $response->get_error_message(),
                502
            );
        }

        return ApiResponse::success($response);
    }

    /**
     * Cancel running scan.
     */
    public function cancelScan(WP_REST_Request $request): WP_REST_Response
    {
        $siteId = SiteIdentity::getSiteInstanceId();
        $jobId = sanitize_text_field((string) $request->get_param('job_id'));
        if (empty($jobId)) {
            $jobId = (string) get_option('blognexa_last_crawl_job_id', '');
        }

        if (empty($jobId)) {
            return ApiResponse::error('missing_job_id', __('No active job to cancel.', 'blognexa-ai'), 400);
        }

        $client = new WordPressHTTPClient();
        $endpoint = "/v1/sites/{$siteId}/crawl-jobs/{$jobId}/cancel";

        $response = $client->post($endpoint);
        if (is_wp_error($response)) {
            return ApiResponse::error(
                $response->get_error_code(),
                $response->get_error_message(),
                502
            );
        }

        return ApiResponse::success($response);
    }
}

