"""BlogNexa AI - Credential Models and In-Memory Storage."""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class CredentialRecord(BaseModel):
    credential_id: str
    api_secret: str
    key_version: str = "1"
    tenant_id: str
    site_id: str
    status: str = "ACTIVE"
    scopes: List[str] = Field(default_factory=lambda: [
        "site:status",
        "jobs:read",
        "jobs:write",
        "knowledge:read",
        "knowledge:write",
        "publishing:execute"
    ])


class CredentialStore:
    """Credential Store with in-memory persistence and active/revocation state."""

    def __init__(self) -> None:
        self._credentials: Dict[str, CredentialRecord] = {}
        # Pre-seed standard test credentials
        self.register(CredentialRecord(
            credential_id="cred-test-tenant-001",
            api_secret="secret-key-32-chars-long-123456",
            key_version="1",
            tenant_id="c1234567-89ab-cdef-0123-456789abcdef",
            site_id="s9876543-21ba-fedc-3210-fedcba987654",
            status="ACTIVE"
        ))
        self.register(CredentialRecord(
            credential_id="cred-test-tenant-002",
            api_secret="different-secret-for-tenant-002!!",
            key_version="1",
            tenant_id="c9999999-99ab-cdef-0123-999999999999",
            site_id="s8888888-21ba-fedc-3210-888888888888",
            status="ACTIVE"
        ))

    def register(self, cred: CredentialRecord) -> None:
        self._credentials[cred.credential_id] = cred

    def get(self, credential_id: str) -> Optional[CredentialRecord]:
        return self._credentials.get(credential_id)

    def revoke(self, credential_id: str) -> bool:
        if credential_id in self._credentials:
            self._credentials[credential_id].status = "REVOKED"
            return True
        return False


credential_store = CredentialStore()
