"""BlogNexa AI - Tenant Context Data Model and FastApi Dependency."""

from typing import List
from pydantic import BaseModel, Field


class TenantContext(BaseModel):
    credential_id: str
    tenant_id: str
    site_id: str
    key_version: str = "1"
    scopes: List[str] = Field(default_factory=list)

    def has_scope(self, required_scope: str) -> bool:
        return required_scope in self.scopes or "admin:all" in self.scopes

