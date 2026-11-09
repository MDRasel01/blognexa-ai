# BlogNexa AI — Foundation Specification
**Document ID:** BNX-ENG-001  
**Phase:** 01 — Foundation  
**Status:** Approved & Enforced  
**Primary Interface:** WordPress Admin Dashboard  

---

## 1. Executive Summary
BlogNexa AI is an enterprise-grade AI-powered WordPress content intelligence and blog automation plugin.
It operates on a **hybrid architecture**:
- **WordPress Plugin (Admin SPA & Orchestrator):** Manages user experience, capability authorization, site discovery endpoints, local configuration, Media Library integration, SEO metadata coordination, and idempotent content publishing.
- **Cloud AI Backend (FastAPI, PostgreSQL, pgvector, Redis):** Manages computationally intensive operations including SSRF-safe crawling, knowledge chunking, vector embeddings, RAG retrieval, multi-provider AI orchestration, and asynchronous job queuing.

---

## 2. Architecture Principles
1. **WordPress Admin First:** All 11 core modules live inside the WordPress Admin navigation hierarchy (`blognexa-ai`). No external SaaS dashboard is required for normal workflow.
2. **Capability-Based Access Control:** Role names are never used alone for authorization. Granular capabilities (`blognexa_access`, `blognexa_publish_blog`, etc.) guard every privileged action.
3. **REST API Guardrails:** All private REST endpoints strictly define HTTP methods, nonces, permission callbacks, contextual sanitization, and structured error responses.
4. **Publishing Idempotency:** Content publishing is transactional and guarded by `wp_bnx_publications` idempotency keys to eliminate duplicate post creation.
5. **Multi-Provider AI Abstraction:** Domain logic is decoupled from specific AI provider schemas.
6. **Data Ownership Split:** WordPress stores local operational metadata, state, and publications. Cloud backend stores large-scale crawled content, chunks, embeddings, and research evidence.

