"""BlogNexa AI - Replay Protection Tests."""

import pytest
from backend.tests.conftest import make_signed_headers


def test_first_request_accepted_replay_rejected(client):
    fixed_nonce = "fixed-replay-test-nonce-123456"
    headers = make_signed_headers(method="GET", path="/v1/site/status", nonce=fixed_nonce)

    # First request must succeed
    res1 = client.get("/v1/site/status", headers=headers)
    assert res1.status_code == 200

    # Replaying the exact same request with identical nonce must be rejected
    res2 = client.get("/v1/site/status", headers=headers)
    assert res2.status_code == 401
    assert "REPLAY_ATTACK_DETECTED" in res2.json()["detail"]

