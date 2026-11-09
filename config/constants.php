<?php
/**
 * BlogNexa AI - Global Constants Definition
 *
 * @package BlogNexaAI
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

// Plugin Meta
if (!defined('BLOGNEXA_VERSION')) {
    define('BLOGNEXA_VERSION', '1.0.0');
}
if (!defined('BLOGNEXA_DB_VERSION')) {
    define('BLOGNEXA_DB_VERSION', '1.0.0');
}
if (!defined('BLOGNEXA_SLUG')) {
    define('BLOGNEXA_SLUG', 'blognexa-ai');
}
if (!defined('BLOGNEXA_TEXT_DOMAIN')) {
    define('BLOGNEXA_TEXT_DOMAIN', 'blognexa-ai');
}
if (!defined('BLOGNEXA_REST_NAMESPACE')) {
    define('BLOGNEXA_REST_NAMESPACE', 'blognexa/v1');
}

// Environment Minimum Requirements
if (!defined('BLOGNEXA_MIN_PHP_VERSION')) {
    define('BLOGNEXA_MIN_PHP_VERSION', '8.1.0');
}
if (!defined('BLOGNEXA_MIN_WP_VERSION')) {
    define('BLOGNEXA_MIN_WP_VERSION', '6.2');
}

// Paths and URLs
if (!defined('BLOGNEXA_FILE')) {
    define('BLOGNEXA_FILE', dirname(__DIR__) . '/blognexa-ai.php');
}
if (!defined('BLOGNEXA_PATH')) {
    define('BLOGNEXA_PATH', dirname(__DIR__) . '/');
}
if (!defined('BLOGNEXA_CONFIG_PATH')) {
    define('BLOGNEXA_CONFIG_PATH', BLOGNEXA_PATH . 'config/');
}
if (!defined('BLOGNEXA_RESOURCES_PATH')) {
    define('BLOGNEXA_RESOURCES_PATH', BLOGNEXA_PATH . 'resources/');
}
if (!defined('BLOGNEXA_TEMPLATES_PATH')) {
    define('BLOGNEXA_TEMPLATES_PATH', BLOGNEXA_PATH . 'templates/');
}

// Database Table Suffixes
if (!defined('BLOGNEXA_TABLE_CONNECTIONS')) {
    define('BLOGNEXA_TABLE_CONNECTIONS', 'bnx_connections');
}
if (!defined('BLOGNEXA_TABLE_JOBS')) {
    define('BLOGNEXA_TABLE_JOBS', 'bnx_jobs');
}
if (!defined('BLOGNEXA_TABLE_PUBLICATIONS')) {
    define('BLOGNEXA_TABLE_PUBLICATIONS', 'bnx_publications');
}
if (!defined('BLOGNEXA_TABLE_AUDIT')) {
    define('BLOGNEXA_TABLE_AUDIT', 'bnx_audit');
}

// Capabilities
if (!defined('BLOGNEXA_CAP_ACCESS')) {
    define('BLOGNEXA_CAP_ACCESS', 'blognexa_access');
}
if (!defined('BLOGNEXA_CAP_MANAGE_SETTINGS')) {
    define('BLOGNEXA_CAP_MANAGE_SETTINGS', 'blognexa_manage_settings');
}
if (!defined('BLOGNEXA_CAP_SCAN_WEBSITE')) {
    define('BLOGNEXA_CAP_SCAN_WEBSITE', 'blognexa_scan_website');
}
if (!defined('BLOGNEXA_CAP_MANAGE_KNOWLEDGE')) {
    define('BLOGNEXA_CAP_MANAGE_KNOWLEDGE', 'blognexa_manage_knowledge');
}
if (!defined('BLOGNEXA_CAP_MANAGE_STRATEGY')) {
    define('BLOGNEXA_CAP_MANAGE_STRATEGY', 'blognexa_manage_strategy');
}
if (!defined('BLOGNEXA_CAP_MANAGE_SEO')) {
    define('BLOGNEXA_CAP_MANAGE_SEO', 'blognexa_manage_seo');
}
if (!defined('BLOGNEXA_CAP_CREATE_BLOG')) {
    define('BLOGNEXA_CAP_CREATE_BLOG', 'blognexa_create_blog');
}
if (!defined('BLOGNEXA_CAP_EDIT_BLOG')) {
    define('BLOGNEXA_CAP_EDIT_BLOG', 'blognexa_edit_blog');
}
if (!defined('BLOGNEXA_CAP_APPROVE_BLOG')) {
    define('BLOGNEXA_CAP_APPROVE_BLOG', 'blognexa_approve_blog');
}
if (!defined('BLOGNEXA_CAP_PUBLISH_BLOG')) {
    define('BLOGNEXA_CAP_PUBLISH_BLOG', 'blognexa_publish_blog');
}
if (!defined('BLOGNEXA_CAP_MANAGE_INTEGRATIONS')) {
    define('BLOGNEXA_CAP_MANAGE_INTEGRATIONS', 'blognexa_manage_integrations');
}
if (!defined('BLOGNEXA_CAP_VIEW_ANALYTICS')) {
    define('BLOGNEXA_CAP_VIEW_ANALYTICS', 'blognexa_view_analytics');
}
if (!defined('BLOGNEXA_CAP_MANAGE_DATA')) {
    define('BLOGNEXA_CAP_MANAGE_DATA', 'blognexa_manage_data');
}

