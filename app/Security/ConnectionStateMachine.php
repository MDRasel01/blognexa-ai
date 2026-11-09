<?php
/**
 * BlogNexa AI - Connection Lifecycle State Machine
 *
 * @package BlogNexaAI\Security
 */

declare(strict_types=1);

namespace BlogNexaAI\Security;

if (!defined('ABSPATH')) {
    exit;
}

final class ConnectionStateMachine
{
    public const STATE_DISCONNECTED       = 'DISCONNECTED';
    public const STATE_ENROLLMENT_PENDING = 'ENROLLMENT_PENDING';
    public const STATE_AUTHENTICATING     = 'AUTHENTICATING';
    public const STATE_CONNECTED          = 'CONNECTED';
    public const STATE_DEGRADED           = 'DEGRADED';
    public const STATE_RETRYING           = 'RETRYING';
    public const STATE_REVOKED            = 'REVOKED';

    public const ALL_STATES = [
        self::STATE_DISCONNECTED,
        self::STATE_ENROLLMENT_PENDING,
        self::STATE_AUTHENTICATING,
        self::STATE_CONNECTED,
        self::STATE_DEGRADED,
        self::STATE_RETRYING,
        self::STATE_REVOKED,
    ];

    public const OPTION_CURRENT_STATE = 'blognexa_connection_state';
    public const OPTION_LAST_CHECK    = 'blognexa_last_connection_check';
    public const OPTION_STATE_REASON  = 'blognexa_connection_reason';

    /**
     * Allowed state transitions map.
     */
    private const ALLOWED_TRANSITIONS = [
        self::STATE_DISCONNECTED => [
            self::STATE_ENROLLMENT_PENDING,
            self::STATE_AUTHENTICATING,
        ],
        self::STATE_ENROLLMENT_PENDING => [
            self::STATE_AUTHENTICATING,
            self::STATE_DISCONNECTED,
        ],
        self::STATE_AUTHENTICATING => [
            self::STATE_CONNECTED,
            self::STATE_DISCONNECTED,
            self::STATE_DEGRADED,
        ],
        self::STATE_CONNECTED => [
            self::STATE_DEGRADED,
            self::STATE_RETRYING,
            self::STATE_REVOKED,
            self::STATE_DISCONNECTED,
        ],
        self::STATE_DEGRADED => [
            self::STATE_AUTHENTICATING,
            self::STATE_CONNECTED,
            self::STATE_REVOKED,
            self::STATE_DISCONNECTED,
        ],
        self::STATE_RETRYING => [
            self::STATE_CONNECTED,
            self::STATE_DEGRADED,
            self::STATE_DISCONNECTED,
        ],
        self::STATE_REVOKED => [
            self::STATE_DISCONNECTED,
            self::STATE_ENROLLMENT_PENDING,
        ],
    ];

    /**
     * Get the current connection state.
     */
    public static function getState(): string
    {
        $state = get_option(self::OPTION_CURRENT_STATE);
        if (is_string($state) && in_array($state, self::ALL_STATES, true)) {
            return $state;
        }

        return self::STATE_DISCONNECTED;
    }

    /**
     * Check if transitioning to new state is allowed.
     */
    public static function canTransition(string $toState): bool
    {
        $currentState = self::getState();
        if ($currentState === $toState) {
            return true;
        }

        $allowed = self::ALLOWED_TRANSITIONS[$currentState] ?? [];
        return in_array($toState, $allowed, true);
    }

    /**
     * Transition to a new state with audit reasoning.
     *
     * @param string $toState Target state
     * @param string $reason Human-readable explanation
     * @param bool $force Force transition bypassing transition checks
     * @return bool True if transitioned, false if disallowed
     */
    public static function transitionTo(string $toState, string $reason = '', bool $force = false): bool
    {
        if (!in_array($toState, self::ALL_STATES, true)) {
            return false;
        }

        if (!$force && !self::canTransition($toState)) {
            return false;
        }

        $fromState = self::getState();
        update_option(self::OPTION_CURRENT_STATE, $toState, false);
        update_option(self::OPTION_LAST_CHECK, time(), false);
        update_option(self::OPTION_STATE_REASON, sanitize_text_field($reason), false);

        AuditLogger::log('CONNECTION_STATE_CHANGED', 'connection', $toState, [
            'from_state' => $fromState,
            'to_state'   => $toState,
            'reason'     => $reason,
        ]);

        return true;
    }

    /**
     * Get connection diagnostic summary.
     *
     * @return array<string, mixed>
     */
    public static function getDiagnostics(): array
    {
        $hasCredentials = CredentialStore::hasCredentials();
        $isCloned = SiteIdentity::isCloneOrUrlChanged();
        $state = self::getState();

        return [
            'state'             => $state,
            'is_connected'      => $state === self::STATE_CONNECTED && $hasCredentials && !$isCloned,
            'has_credentials'   => $hasCredentials,
            'is_clone_detected' => $isCloned,
            'last_check'        => (int) get_option(self::OPTION_LAST_CHECK, 0),
            'reason'            => (string) get_option(self::OPTION_STATE_REASON, ''),
            'site_instance_id'  => SiteIdentity::getSiteInstanceId(),
        ];
    }
}

