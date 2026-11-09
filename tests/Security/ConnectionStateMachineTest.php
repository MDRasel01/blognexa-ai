<?php
/**
 * BlogNexa AI - Connection State Machine Unit Tests
 *
 * @package BlogNexaAI\Tests\Security
 */

declare(strict_types=1);

namespace BlogNexaAI\Tests\Security;

use BlogNexaAI\Security\ConnectionStateMachine;

final class ConnectionStateMachineTest
{
    public static function run(): array
    {
        $results = [];

        // Reset to initial state
        update_option(ConnectionStateMachine::OPTION_CURRENT_STATE, ConnectionStateMachine::STATE_DISCONNECTED);

        // Test 1: Initial state
        $state = ConnectionStateMachine::getState();
        $results[] = [
            'name'   => 'ConnectionStateMachine starts in DISCONNECTED state',
            'passed' => $state === ConnectionStateMachine::STATE_DISCONNECTED,
            'detail' => "Current: {$state}",
        ];

        // Test 2: Valid transition (DISCONNECTED -> ENROLLMENT_PENDING)
        $t1 = ConnectionStateMachine::transitionTo(ConnectionStateMachine::STATE_ENROLLMENT_PENDING, 'Enrollment started');
        $results[] = [
            'name'   => 'ConnectionStateMachine allows valid transition (DISCONNECTED -> ENROLLMENT_PENDING)',
            'passed' => $t1 && ConnectionStateMachine::getState() === ConnectionStateMachine::STATE_ENROLLMENT_PENDING,
            'detail' => 'Transition succeeded',
        ];

        // Test 3: Disallowed transition (ENROLLMENT_PENDING -> CONNECTED directly without AUTHENTICATING)
        $t2 = ConnectionStateMachine::transitionTo(ConnectionStateMachine::STATE_CONNECTED, 'Attempting direct connect');
        $results[] = [
            'name'   => 'ConnectionStateMachine rejects disallowed direct jump (ENROLLMENT_PENDING -> CONNECTED)',
            'passed' => $t2 === false && ConnectionStateMachine::getState() === ConnectionStateMachine::STATE_ENROLLMENT_PENDING,
            'detail' => 'Disallowed transition safely blocked',
        ];

        // Test 4: Valid sequence (ENROLLMENT_PENDING -> AUTHENTICATING -> CONNECTED)
        $t3 = ConnectionStateMachine::transitionTo(ConnectionStateMachine::STATE_AUTHENTICATING, 'Handshake');
        $t4 = ConnectionStateMachine::transitionTo(ConnectionStateMachine::STATE_CONNECTED, 'Verified');
        $results[] = [
            'name'   => 'ConnectionStateMachine reaches CONNECTED through verified handshake',
            'passed' => $t3 && $t4 && ConnectionStateMachine::getState() === ConnectionStateMachine::STATE_CONNECTED,
            'detail' => 'Transition sequence completed',
        ];

        // Test 5: Diagnostics structure
        $diag = ConnectionStateMachine::getDiagnostics();
        $results[] = [
            'name'   => 'ConnectionStateMachine provides structured diagnostic status',
            'passed' => isset($diag['state'], $diag['site_instance_id'], $diag['is_clone_detected']),
            'detail' => 'Diagnostic keys verified',
        ];

        return $results;
    }
}

