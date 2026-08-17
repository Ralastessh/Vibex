"""Tailscale Serve 신원 및 이전 기기 토큰 인증.

이 시스템은 원격에서 로컬 코드를 변경한다. 인증이 뚫리면 나머지 방어는 의미가 없다.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from src.config.settings import Settings
from src.main import create_app
from tests.conftest import AUTH, TOKEN


def test_health_needs_no_token(client):
    """iPad Connection 화면(§19)이 도달 가능 여부를 먼저 확인해야 한다."""
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_health_leaks_nothing_sensitive(client):
    body = client.get("/api/v1/health").text
    assert TOKEN not in body
    assert "repoPath" not in body


@pytest.mark.parametrize(
    "headers",
    [
        {},
        {"Authorization": ""},
        {"Authorization": "Bearer"},
        {"Authorization": "Bearer "},
        {"Authorization": TOKEN},  # 스킴 없음
        {"Authorization": f"Basic {TOKEN}"},
        {"Authorization": "Bearer wrong-token"},
        {"Authorization": f"Bearer {TOKEN}x"},  # 접두사가 같아도 거부
    ],
)
def test_projects_rejects_bad_credentials(client, headers):
    assert client.get("/api/v1/projects", headers=headers).status_code == 401


def test_rejection_advertises_tailscale(client):
    r = client.get("/api/v1/projects")
    assert r.headers.get("WWW-Authenticate") == "Tailscale"


def test_valid_token_is_accepted(client):
    assert client.get("/api/v1/projects", headers=AUTH).status_code == 200


def test_server_starts_without_legacy_token(tmp_path):
    settings = Settings(device_token="", projects_file=tmp_path / "p.json")
    with TestClient(create_app(settings)) as local_client:
        assert local_client.get("/api/v1/health").status_code == 200


def test_loopback_request_needs_no_app_token(tmp_path):
    settings = Settings(device_token="", projects_file=tmp_path / "p.json")
    with TestClient(create_app(settings), client=("127.0.0.1", 51000)) as local_client:
        assert local_client.get("/api/v1/projects").status_code == 200


def test_spoofed_tailscale_header_is_rejected_off_loopback(client):
    response = client.get(
        "/api/v1/projects",
        headers={"Tailscale-User-Login": "user@example.com"},
    )
    assert response.status_code == 401


def test_tailscale_user_allowlist_applies_at_loopback(tmp_path):
    settings = Settings(
        device_token="",
        projects_file=tmp_path / "p.json",
        tailscale_allowed_users="allowed@example.com",
    )
    with TestClient(create_app(settings), client=("127.0.0.1", 51000)) as local_client:
        accepted = local_client.get(
            "/api/v1/projects",
            headers={"Tailscale-User-Login": "allowed@example.com"},
        )
        rejected = local_client.get(
            "/api/v1/projects",
            headers={"Tailscale-User-Login": "other@example.com"},
        )
    assert accepted.status_code == 200
    assert rejected.status_code == 401
