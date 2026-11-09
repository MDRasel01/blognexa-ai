<?php
/**
 * BlogNexa AI - Audit Logs Repository
 *
 * @package BlogNexaAI\Database\Repositories
 */

declare(strict_types=1);

namespace BlogNexaAI\Database\Repositories;

if (!defined('ABSPATH')) {
    exit;
}

final class AuditRepository
{
    /**
     * Get table name with prefix.
     *
     * @return string
     */
    private function getTableName(): string
    {
        global $wpdb;
        return $wpdb->prefix . BLOGNEXA_TABLE_AUDIT;
    }

    /**
     * Log an audit event.
     *
     * @param int $userId
     * @param string $action
     * @param string $objectType
     * @param string $objectId
     * @param array<string, mixed> $details
     * @param string $ipAddress
     * @return bool
     */
    public function record(
        int $userId,
        string $action,
        string $objectType = '',
        string $objectId = '',
        array $details = [],
        string $ipAddress = ''
    ): bool {
        global $wpdb;

        $table = $this->getTableName();
        $serializedDetails = !empty($details) ? wp_json_encode($details) : null;

        $inserted = $wpdb->insert(
            $table,
            [
                'user_id'     => $userId,
                'action'      => sanitize_key($action),
                'object_type' => sanitize_key($objectType),
                'object_id'   => sanitize_text_field($objectId),
                'ip_address'  => sanitize_text_field($ipAddress),
                'details'     => $serializedDetails,
                'created_at'  => current_time('mysql', 1),
            ],
            ['%d', '%s', '%s', '%s', '%s', '%s', '%s']
        );

        return $inserted !== false;
    }

    /**
     * Get recent audit entries with pagination.
     *
     * @param int $limit
     * @param int $offset
     * @return array<array<string, mixed>>
     */
    public function getRecent(int $limit = 20, int $offset = 0): array
    {
        global $wpdb;
        $table = $this->getTableName();

        $limit = absint($limit);
        $offset = absint($offset);

        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$table} ORDER BY id DESC LIMIT %d OFFSET %d",
                $limit,
                $offset
            ),
            ARRAY_A
        );

        return is_array($results) ? $results : [];
    }
}

