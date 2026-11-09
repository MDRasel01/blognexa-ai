# Database Schema Specification

**Plugin:** BlogNexa AI  
**Schema Version:** 1.0.0  

## Table Definitions

### 1. `wp_bnx_connections`
* `id`: BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
* `site_uuid`: VARCHAR(64) NOT NULL UNIQUE
* `backend_url`: VARCHAR(255) NOT NULL
* `api_key_hash`: VARCHAR(255) NOT NULL
* `status`: VARCHAR(32) NOT NULL DEFAULT 'disconnected'
* `metadata`: LONGTEXT NULL
* `last_ping_at`: DATETIME NULL
* `created_at`, `updated_at`: DATETIME

### 2. `wp_bnx_jobs`
* `id`: BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
* `job_uuid`: VARCHAR(64) NOT NULL UNIQUE
* `job_type`: VARCHAR(64) NOT NULL
* `status`: VARCHAR(32) NOT NULL DEFAULT 'queued'
* `progress`: TINYINT UNSIGNED NOT NULL DEFAULT 0
* `payload`: LONGTEXT NULL
* `error_message`: TEXT NULL
* `attempts`: TINYINT UNSIGNED NOT NULL DEFAULT 0
* `started_at`, `finished_at`, `created_at`, `updated_at`: DATETIME
* Indexes: `(job_type, status)`, `(created_at)`

### 3. `wp_bnx_publications`
* `id`: BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
* `post_id`: BIGINT UNSIGNED NOT NULL DEFAULT 0
* `article_uuid`: VARCHAR(64) NOT NULL
* `idempotency_key`: VARCHAR(128) NOT NULL UNIQUE (Guarantees zero duplicate post publication)
* `publish_status`: VARCHAR(32) NOT NULL DEFAULT 'draft'
* `metadata`: LONGTEXT NULL
* `published_at`, `created_at`, `updated_at`: DATETIME
* Indexes: `(article_uuid)`, `(post_id)`

### 4. `wp_bnx_audit`
* `id`: BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
* `user_id`: BIGINT UNSIGNED NOT NULL DEFAULT 0
* `action`: VARCHAR(100) NOT NULL
* `object_type`: VARCHAR(50) NOT NULL DEFAULT ''
* `object_id`: VARCHAR(100) NOT NULL DEFAULT ''
* `ip_address`: VARCHAR(45) NOT NULL DEFAULT ''
* `details`: LONGTEXT NULL (with credentials automatically redacted)
* `created_at`: DATETIME
* Indexes: `(user_id)`, `(action)`, `(created_at)`

