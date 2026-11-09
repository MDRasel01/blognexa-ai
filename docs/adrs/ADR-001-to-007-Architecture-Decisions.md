# Architecture Decision Records (ADRs)
**Plugin:** BlogNexa AI  
**Scope:** Phase 01 Foundation  

---

### ADR-001: Hybrid Architecture
* **Status:** Accepted
* **Context:** WordPress sites vary widely in hosting resources. Heavy AI scraping, chunking, and embedding generation cannot run synchronously on typical shared hosting environments.
* **Decision:** Split system into WordPress Plugin (local UI, permissions, publishing) and Cloud Backend (crawling, RAG, research, AI orchestration).

---

### ADR-002: Primary User Interface
* **Status:** Accepted
* **Context:** Users prefer staying within their WordPress management workflow rather than logging into an external dashboard.
* **Decision:** The primary user interface is built as a single-page React application hosted inside the WordPress Admin Sidebar under the `BlogNexa AI` menu.

---

### ADR-003: Plugin Architecture (Modular Monolith)
* **Status:** Accepted
* **Context:** Premature micro-packaging creates excessive complexity. A monolithic script is unmaintainable.
* **Decision:** Implement a Modular Monolith with PSR-4 autoloading (`BlogNexaAI\`), a lightweight dependency injection container, and isolated module namespaces for the 11 feature domains.

---

### ADR-004: Multi-Provider AI Abstraction
* **Status:** Accepted
* **Context:** AI models and providers evolve rapidly.
* **Decision:** Plugin and backend domain services interact with model-agnostic DTOs and contracts rather than provider-specific APIs directly.

---

### ADR-005: Publishing Strategy
* **Status:** Accepted
* **Context:** Unsupervised automatic publishing risks posting inaccurate or hallucinated content.
* **Decision:** Default behavior is Review-First (Draft). Automatic publishing requires explicit configuration, quality checks, and transactional idempotency locks.

---

### ADR-006: Backend Reference Stack
* **Status:** Accepted
* **Context:** Python ecosystem offers optimal support for vector search, scraping, and LLM orchestration.
* **Decision:** Cloud backend utilizes FastAPI, PostgreSQL + pgvector, Redis queue workers, and S3-compatible object storage.

---

### ADR-007: Split Database Ownership
* **Status:** Accepted
* **Context:** Storing thousands of vector embeddings and scraped HTML in `wp_options` or `wp_postmeta` degrades WordPress database performance.
* **Decision:** WordPress database owns local plugin settings, job references, and publication records (`wp_bnx_*`). Cloud backend database owns raw crawl data, document chunks, and embeddings.

