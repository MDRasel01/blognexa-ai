# BlogNexa AI — Tenant Isolation Architecture & Data Security

**Document ID:** BNX-SEC-TENANT-004  
**Date:** 2026-11-09  
**Phase:** 04 — Security Foundation Hardening & Secure Backend Connection  
**Status:** Canonical Standard  

---

## 1. Principles of Tenant Isolation

BlogNexa AI serves multiple independent WordPress websites and corporate customers through a shared Cloud Backend. Maintaining absolute data isolation between tenants is an immutable security requirement.

### Non-Negotiable Rules
1. **Server-Derived Identity:** Tenant identity (`tenant_id`, `site_id`) is NEVER accepted from request headers, query parameters, or JSON body fields. It is derived exclusively from the authenticated credential verified during the HMAC handshake.
2. **Fail-Closed Authorization:** Any query lacking an authenticated tenant context is rejected prior to database dispatch.
3. **No Global Reads:** Unscoped queries across tenant boundaries (`SELECT * FROM bnx_jobs;`) are forbidden at the application and ORM levels.
4. **Isolated Vector Spaces:** Knowledge base embeddings must never be retrieved without explicit metadata filters scoped to the authenticated tenant.

---

## 2. Server-Derived Tenant Context Pipeline

```
[ Incoming Signed HTTP Request ]
               |
               v
[ HMAC Authentication Middleware ]
  * Validates signature against credential_id
  * Resolves stored database record:
    - credential_id
    - tenant_id
    - site_id
    - status (ACTIVE / REVOKED)
    - scopes (['jobs:write', 'knowledge:read', ...])
               |
               v
[ Tenant Context Dependency (FastAPI) ]
  * Injects TenantContext(tenant_id, site_id, scopes) into endpoint handlers
  * Overrides any client-supplied tenant ID with server-verified context
               |
               v
[ Scoped Database Query / PostgreSQL RLS ]
```

---

## 3. Relational Database Isolation (PostgreSQL)

### 3.1 Schema Standard
Every tenant-owned table in the Cloud Backend database (`bnx_jobs`, `bnx_knowledge_chunks`, `bnx_publications`, `bnx_site_settings`) MUST include:
* `tenant_id UUID NOT NULL`
* `site_id UUID NOT NULL`
* Composite index on `(tenant_id, site_id)` and `(tenant_id, id)`

### 3.2 PostgreSQL Row-Level Security (RLS) Implementation
In addition to application-level query scoping, PostgreSQL Row-Level Security provides defense-in-depth against SQL injection or developer query omission:

```sql
-- Enable RLS on core tables
ALTER TABLE bnx_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bnx_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bnx_publications ENABLE ROW LEVEL SECURITY;

-- Define tenant isolation policy for session variable app.current_tenant_id
CREATE POLICY bnx_jobs_tenant_isolation ON bnx_jobs
    AS RESTRICTIVE
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY bnx_knowledge_tenant_isolation ON bnx_knowledge_chunks
    AS RESTRICTIVE
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
```

During session initialization, the FastAPI database connection sets the session variable:
```sql
SET LOCAL app.current_tenant_id = 'c1234567-89ab-cdef-0123-456789abcdef';
```

---

## 4. Vector Database & RAG Isolation

BlogNexa AI's Website Intelligence and Knowledge Base modules generate vector embeddings stored in a vector database (e.g. pgvector, Qdrant, or Pinecone).

### Rules for Vector Search:
1. **Metadata Partitioning:** Every stored vector payload includes:
   ```json
   {
     "tenant_id": "c1234567-89ab-cdef-0123-456789abcdef",
     "site_id": "s9876543-21ba-fedc-3210-fedcba987654",
     "document_id": "doc_102",
     "chunk_index": 3,
     "text": "..."
   }
   ```
2. **Mandatory Query Filter:** No nearest-neighbor similarity search query may execute without an explicit filter:
   ```python
   # FastAPI RAG Query Guard
   results = vector_client.search(
       collection_name="knowledge_embeddings",
       query_vector=embedding,
       query_filter={
           "must": [
               {"key": "tenant_id", "match": {"value": str(tenant_context.tenant_id)}},
               {"key": "site_id", "match": {"value": str(tenant_context.site_id)}}
           ]
       },
       limit=5
   )
   ```
3. **Cross-Tenant Vector Defense:** Even if an attacker supplies a search vector identical to another tenant's confidential document, the mandatory metadata boundary drops all non-matching vectors before ranking.

---

## 5. Automated Cross-Tenant Verification Test

To verify isolation before deployment:
1. Seed Tenant A with private job record `Job-A1` (`tenant_id = T1`).
2. Seed Tenant B with private job record `Job-B1` (`tenant_id = T2`).
3. Authenticate as Tenant A using Tenant A's HMAC credentials.
4. Issue `GET /v1/jobs/Job-B1` (attempting to retrieve Tenant B's data).
5. **Expected Result:** Backend returns `HTTP 404 Not Found` (or `HTTP 403 Forbidden`). Zero row content leaked.
6. Issue `GET /v1/jobs` (listing jobs).
7. **Expected Result:** Backend returns only `Job-A1`. `Job-B1` is completely absent from the response.

