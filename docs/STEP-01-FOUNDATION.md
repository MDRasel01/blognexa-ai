# Step 01 — Product & Technical Foundation

**Document ID:** BNX-ENG-001  
**Phase:** 01 — Foundation  
**Status:** Approved Baseline  

## Summary
Step 01 establishes the product boundaries, architectural guidelines, and non-negotiables for BlogNexa AI:
1. **Primary Interface:** WordPress Admin Dashboard sidebar navigation (`BlogNexa AI`).
2. **Hybrid Architecture:** Local WordPress operations (settings, capabilities, publishing, Media Library) combined with secure Cloud AI Backend (crawling, RAG, embeddings, research).
3. **Capability Authorization:** 13 granular capabilities guarding all privileged actions.
4. **Data Ownership:** Local tables `wp_bnx_*` store operational state; heavy chunks and vectors live in Cloud Backend.

