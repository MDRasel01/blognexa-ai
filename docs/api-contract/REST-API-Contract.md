# REST API Contract Specification
**Plugin:** BlogNexa AI  
**Namespace:** `/wp-json/blognexa/v1/`  
**Authentication:** WordPress Cookie + `X-WP-Nonce` header  

---

## 1. Global Response Envelopes

### Success Envelope (HTTP 200 / 201)
```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-11-09T17:00:00Z",
  "meta": {
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 100
    }
  }
}
```

### Error Envelope (HTTP 4xx / 5xx)
```json
{
  "code": "blognexa_forbidden",
  "message": "You do not have the required permission to perform this action.",
  "data": {
    "status": 403,
    "details": null
  }
}
```

---

## 2. Core Foundation Endpoints

### `GET /wp-json/blognexa/v1/status`
* **Permission:** `blognexa_access`
* **Response:**
```json
{
  "success": true,
  "data": {
    "plugin": {
      "name": "BlogNexa AI",
      "version": "1.0.0",
      "db_version": "1.0.0",
      "status": "healthy"
    },
    "environment": {
      "php_version": "8.1.34",
      "wp_version": "6.7",
      "mysql_version": "10.6.18-MariaDB"
    },
    "timestamp": "2026-11-09 17:00:00"
  }
}
```

### `GET /wp-json/blognexa/v1/connection/status`
* **Permission:** `blognexa_access`
* **Response:**
```json
{
  "success": true,
  "data": {
    "connected": false,
    "status": "disconnected",
    "message": "Site is not connected to BlogNexa Cloud."
  }
}
```

### `POST /wp-json/blognexa/v1/connection/connect`
* **Permission:** `blognexa_manage_settings`
* **Request Body:**
```json
{
  "api_key": "bnx_live_xxxxxxxxxxxx",
  "backend_url": "https://api.blognexa.ai"
}
```

### `POST /wp-json/blognexa/v1/website/scan`
* **Permission:** `blognexa_scan_website`
* **Request Body:**
```json
{
  "scope": "incremental",
  "max_pages": 100
}
```
* **Response:** Returns `job_uuid` queued locally and in cloud backend.

