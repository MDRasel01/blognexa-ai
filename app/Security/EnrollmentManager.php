<?php
/**
 * BlogNexa AI - Site Enrollment Manager
 *
 * @package BlogNexaAI\Security
 */

declare(strict_types=1);

namespace BlogNexaAI\Security;

use BlogNexaAI\Infrastructure\HTTP\WordPressHTTPClient;
use WP_Error;

if (!defined('ABSPATH')) {
    exit;
}

final class EnrollmentManager
{
    /**
     * Complete enrollment handshake by exchanging a one-time enrollment code.
     *
     * @param string $enrollmentCode Single-use code generated in cloud console
     * @param string $backendUrl Custom cloud backend URL or default
     * @return array<string, mixed>|WP_Error Array with connection details on success or WP_Error
     */
    public static function exchangeEnrollmentCode(string $enrollmentCode, string $backendUrl = 'https://api.blognexa.ai'): array|WP_Error
    {
        $code = trim($enrollmentCode);
        if (empty($code) || strlen($code) < 8) {
            return new WP_Error('invalid_enrollment_code', __('Enrollment code is invalid or malformed.', 'blognexa-ai'));
        }

        // Transition to AUTHENTICATING
        ConnectionStateMachine::transitionTo(
            ConnectionStateMachine::STATE_AUTHENTICATING,
            'Initiating enrollment code exchange',
            true
        );

        $payload = [
            'enrollment_code'  => $code,
            'site_instance_id' => SiteIdentity::getSiteInstanceId(),
            'site_url'         => site_url(),
            'home_url'         => home_url(),
            'metadata'         => SiteIdentity::getSiteMetadata(),
        ];

        $client = new WordPressHTTPClient($backendUrl, 15);
        $response = $client->post('/v1/enrollment/exchange', $payload);

        if (is_wp_error($response)) {
            ConnectionStateMachine::transitionTo(
                ConnectionStateMachine::STATE_DISCONNECTED,
                'Enrollment exchange network error: ' . $response->get_error_message(),
                true
            );
            return $response;
        }

        if (empty($response['credential_id']) || empty($response['api_secret']) || empty($response['tenant_id'])) {
            ConnectionStateMachine::transitionTo(
                ConnectionStateMachine::STATE_DISCONNECTED,
                'Invalid backend enrollment response format',
                true
            );
            return new WP_Error('invalid_exchange_response', __('Cloud backend returned an incomplete credential bundle.', 'blognexa-ai'));
        }

        // Safely store encrypted credentials
        $storeSuccess = CredentialStore::storeCredentials([
            'credential_id' => sanitize_text_field((string) $response['credential_id']),
            'api_secret'    => (string) $response['api_secret'],
            'key_version'   => sanitize_text_field((string) ($response['key_version'] ?? '1')),
            'tenant_id'     => sanitize_text_field((string) $response['tenant_id']),
            'site_id'       => sanitize_text_field((string) ($response['site_id'] ?? SiteIdentity::getSiteInstanceId())),
            'backend_url'   => esc_url_raw($backendUrl),
        ]);

        if (!$storeSuccess) {
            ConnectionStateMachine::transitionTo(
                ConnectionStateMachine::STATE_DISCONNECTED,
                'Failed to encrypt and store credentials locally',
                true
            );
            return new WP_Error('credential_store_failed', __('Failed to securely encrypt credentials in local storage.', 'blognexa-ai'));
        }

        // Mark site registered and transition state to CONNECTED
        SiteIdentity::markRegistered();
        ConnectionStateMachine::transitionTo(
            ConnectionStateMachine::STATE_CONNECTED,
            'Enrollment completed successfully'
        );

        AuditLogger::log('ENROLLMENT_COMPLETED', 'connection', (string) $response['credential_id'], [
            'tenant_id' => (string) $response['tenant_id'],
        ]);

        return [
            'status'        => 'connected',
            'credential_id' => (string) $response['credential_id'],
            'tenant_id'     => (string) $response['tenant_id'],
            'backend_url'   => $backendUrl,
        ];
    }

    /**
     * Disconnect site from cloud backend and purge local credentials.
     */
    public static function disconnect(): bool
    {
        CredentialStore::clearCredentials();
        SiteIdentity::clearRegistration();
        ConnectionStateMachine::transitionTo(
            ConnectionStateMachine::STATE_DISCONNECTED,
            'User initiated disconnect',
            true
        );

        AuditLogger::log('CONNECTION_DISCONNECTED', 'connection', 'local');
        return true;
    }
}
