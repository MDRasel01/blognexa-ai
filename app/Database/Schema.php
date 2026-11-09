<?php
/**
 * BlogNexa AI - Database Schema Definition
 *
 * @package BlogNexaAI\Database
 */

declare(strict_types=1);

namespace BlogNexaAI\Database;

if (!defined('ABSPATH')) {
    exit;
}

final class Schema
{
    /**
     * Get SQL definitions for all custom plugin tables.
     *
     * @return array<string>
     */
    public static function getTableDefinitions(): array
    {
        global $wpdb;
        $charsetCollate = $wpdb->get_charset_collate();

        $tableConnections = $wpdb->prefix . BLOGNEXA_TABLE_CONNECTIONS;
        $tableJobs = $wpdb->prefix . BLOGNEXA_TABLE_JOBS;
        $tablePublications = $wpdb->prefix . BLOGNEXA_TABLE_PUBLICATIONS;
        $tableAudit = $wpdb->prefix . BLOGNEXA_TABLE_AUDIT;

        return [
            // Connections Table
            "CREATE TABLE {$tableConnections} (
                id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
                site_uuid varchar(64) NOT NULL,
                backend_url varchar(255) NOT NULL,
                api_key_hash varchar(255) NOT NULL,
                status varchar(32) NOT NULL DEFAULT 'disconnected',
                metadata longtext NULL,
                last_ping_at datetime NULL,
                created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uq_site_uuid (site_uuid),
                KEY idx_status (status)
            ) {$charsetCollate};",

            // Background Jobs Table
            "CREATE TABLE {$tableJobs} (
                id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
                job_uuid varchar(64) NOT NULL,
                job_type varchar(64) NOT NULL,
                status varchar(32) NOT NULL DEFAULT 'queued',
                progress tinyint(3) unsigned NOT NULL DEFAULT 0,
                payload longtext NULL,
                error_message text NULL,
                attempts tinyint(3) unsigned NOT NULL DEFAULT 0,
                started_at datetime NULL,
                finished_at datetime NULL,
                created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uq_job_uuid (job_uuid),
                KEY idx_type_status (job_type, status),
                KEY idx_created_at (created_at)
            ) {$charsetCollate};",

            // Publications Idempotency Table
            "CREATE TABLE {$tablePublications} (
                id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
                post_id bigint(20) unsigned NOT NULL DEFAULT 0,
                article_uuid varchar(64) NOT NULL,
                idempotency_key varchar(128) NOT NULL,
                publish_status varchar(32) NOT NULL DEFAULT 'draft',
                metadata longtext NULL,
                published_at datetime NULL,
                created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uq_idempotency_key (idempotency_key),
                KEY idx_article_uuid (article_uuid),
                KEY idx_post_id (post_id)
            ) {$charsetCollate};",

            // Audit Logs Table
            "CREATE TABLE {$tableAudit} (
                id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
                user_id bigint(20) unsigned NOT NULL DEFAULT 0,
                action varchar(100) NOT NULL,
                object_type varchar(50) NOT NULL DEFAULT '',
                object_id varchar(100) NOT NULL DEFAULT '',
                ip_address varchar(45) NOT NULL DEFAULT '',
                details longtext NULL,
                created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_user_id (user_id),
                KEY idx_action (action),
                KEY idx_created_at (created_at)
            ) {$charsetCollate};"
        ];
    }
}

