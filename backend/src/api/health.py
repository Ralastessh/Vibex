"""서버가 살아 있는지 확인하고 접속 가능한 Tailscale 기기 탐색"""

from __future__ import annotations
import json
import os
from pathlib import Path
import shutil
import subprocess
from fastapi import APIRouter, Request
from src.auth.device import RequireDevice

# PC와의 연결이 되는지 확인하는 테스트 코드
router = APIRouter(tags=["health"])

@router.get("/health")
def health(request: Request) -> dict[str, object]:
    registry = request.app.state.registry
    return {
        "status": "ok",
        "service": "cross-device-cli-bridge",
        "version": "0.1.0",
        "projects": len(registry.list_enabled()),
    }

def _tailscale_binary() -> str | None:
    configured = os.getenv("BRIDGE_TAILSCALE_BINARY", "").strip()
    candidates = [
        configured,
        shutil.which("tailscale") or "",
        "/opt/homebrew/bin/tailscale",
        "/usr/local/bin/tailscale",
        "/Applications/Tailscale.app/Contents/MacOS/Tailscale",
    ]
    return next((item for item in candidates if item and Path(item).is_file()), None)

def _online_tailscale_devices() -> list[dict[str, object]]:
    binary = _tailscale_binary()
    if not binary:
        return []
    completed = subprocess.run(
        [binary, "status", "--json"],
        capture_output=True,
        check=True,
        text=True,
        timeout=8,
        env={**os.environ, "TAILSCALE_BE_CLI": "1"},
    )
    status = json.loads(completed.stdout)
    if status.get("BackendState") != "Running":
        return []

    raw_devices = [(status.get("Self") or {}, True)]
    raw_devices.extend((peer, False) for peer in (status.get("Peer") or {}).values())
    devices: list[dict[str, object]] = []
    for device, is_self in raw_devices:
        dns_name = str(device.get("DNSName") or "").rstrip(".")
        if not dns_name or (not is_self and not device.get("Online", False)):
            continue
        platform = str(device.get("OS") or "").lower()
        if platform and platform not in {"macos", "windows", "linux"}:
            continue
        devices.append({
            "name": dns_name.split(".")[0],
            "dnsName": dns_name,
            "online": True,
            "isSelf": is_self,
        })
    return devices

def tailscale_self_dns_name() -> str | None:
    """Mac의 정식 MagicDNS FQDN. 조회 실패 시 로컬 기능은 유지"""
    try:
        return next(
            (
                str(device["dnsName"])
                for device in _online_tailscale_devices()
                if device.get("isSelf") and device.get("dnsName")
            ),
            None,
        )
    except (OSError, subprocess.SubprocessError, ValueError, json.JSONDecodeError):
        return None


@router.get("/tailscale/devices", dependencies=[RequireDevice])
def tailscale_devices() -> dict[str, object]:
    """tailnet의 온라인 PC 목록. iPad가 각 목록의 health가 정상인지 다시 확인"""
    try:
        return {"devices": _online_tailscale_devices()}
    except (OSError, subprocess.SubprocessError, ValueError, json.JSONDecodeError):
        # Tailscale이 없거나 로그인 전이어도 일반 health는 계속 쓸 수 있다.
        return {"devices": []}
