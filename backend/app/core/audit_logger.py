"""BlogNexa AI - Backend Structured Audit Logger with Secret Redaction."""

import time
import uuid
from typing import Any, Dict, List
from pydantic import BaseModel, Field


SENSITIVE_KEYS = {
    "authorization",
    "api_secret",
    "secret",
    "password",
    "token",
    "access_token",
    "refresh_token",
    "private_key",
    "cookie",
}


def redact_sensitive_data(data: Any) -> Any:
    """Recursively redact sensitive keys in dictionaries and lists."""
    if isinstance(data, dict):
        redacted = {}
        for k, v in data.items():
            if any(s in k.lower() for s in SENSITIVE_KEYS):
                redacted[k] = "[REDACTED]"
            else:
                redacted[k] = redact_sensitive_data(v)
        return redacted
    elif isinstance(data, list):
        return [redact_sensitive_data(item) for item in data]
    return data


class AuditEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: float = Field(default_factory=time.time)
    action: str
    tenant_id: str = ""
    site_id: str = ""
    credential_id: str = ""
    object_type: str = ""
    object_id: str = ""
    details: Dict[str, Any] = Field(default_factory=dict)
    ip_address: str = ""


class AuditStore:
    def __init__(self) -> None:
        self._events: List[AuditEvent] = []

    def log(
        self,
        action: str,
        tenant_id: str = "",
        site_id: str = "",
        credential_id: str = "",
        object_type: str = "",
        object_id: str = "",
        details: Dict[str, Any] = None,
        ip_address: str = ""
    ) -> AuditEvent:
        safe_details = redact_sensitive_data(details or {})
        event = AuditEvent(
            action=action,
            tenant_id=tenant_id,
            site_id=site_id,
            credential_id=credential_id,
            object_type=object_type,
            object_id=object_id,
            details=safe_details,
            ip_address=ip_address
        )
        self._events.append(event)
        return event

    def get_events(self) -> List[AuditEvent]:
        return list(self._events)

    def clear(self) -> None:
        self._events.clear()


audit_store = AuditStore()

