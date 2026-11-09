"""BlogNexa AI - Tenant-Isolated Knowledge Base & RAG Query Endpoints."""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from backend.app.core.hmac_auth import verify_hmac_request
from backend.app.core.tenant_context import TenantContext


router = APIRouter()

# Mock knowledge chunks pre-seeded by tenant
_KNOWLEDGE_STORE: List[Dict[str, Any]] = [
    {
        "id": "chunk-t1-001",
        "tenant_id": "c1234567-89ab-cdef-0123-456789abcdef",
        "site_id": "s9876543-21ba-fedc-3210-fedcba987654",
        "title": "Tenant 1 Brand Guidelines",
        "text": "Tenant 1 uses a friendly and authoritative tone of voice."
    },
    {
        "id": "chunk-t2-002",
        "tenant_id": "c9999999-99ab-cdef-0123-999999999999",
        "site_id": "s8888888-21ba-fedc-3210-888888888888",
        "title": "Tenant 2 Financial Projections",
        "text": "Confidential Q4 sales figures for Tenant 2."
    }
]


@router.get("/query")
def query_knowledge(
    q: str = Query(..., min_length=2),
    ctx: TenantContext = Depends(verify_hmac_request)
):
    """
    RAG Search with mandatory tenant isolation filter.
    Zero results from other tenants are ever returned.
    """
    results = [
        item for item in _KNOWLEDGE_STORE
        if item["tenant_id"] == ctx.tenant_id and (q.lower() in item["text"].lower() or q.lower() in item["title"].lower())
    ]

    return {
        "query": q,
        "tenant_id": ctx.tenant_id,
        "results": results,
        "total": len(results)
    }

