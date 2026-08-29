from __future__ import annotations

import ipaddress
import logging
from fastapi import Depends, Header, HTTPException, Request, status

logger = logging.getLogger("bridge.auth")


def _is_loopback(host: str) -> bool:
    if host.lower() == "localhost":
        return True
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return False


def _allowed_tailscale_user(request: Request, login: str) -> bool:
    allowed = request.app.state.settings.tailscale_user_allowlist
    return not allowed or login.strip().lower() in allowed


def verify_device(
    request: Request,
    tailscale_user_login: str | None = Header(
        default=None, alias="Tailscale-User-Login"
    ),
) -> None:
    """로컬 VS Code 또는 Tailscale Serve를 통과한 요청만 허용한다.

    백엔드는 127.0.0.1에만 바인딩하는 것이 전제다. Tailscale Serve가 원격
    요청을 localhost로 프록시하고 검증된 사용자 헤더를 붙인다.
    """

    client = request.client.host if request.client else "unknown"
    if _is_loopback(client):
        if tailscale_user_login and not _allowed_tailscale_user(
            request, tailscale_user_login
        ):
            _reject(request, f"허용되지 않은 Tailscale 사용자: {tailscale_user_login}")
        return

    # Serve 이외의 네트워크 경로에서 identity header를 신뢰하면 누구나 헤더를
    # 위조할 수 있다. 반드시 localhost 프록시를 통과한 경우에만 위에서 처리한다.
    if tailscale_user_login:
        _reject(request, "localhost 밖에서 전달된 Tailscale 신원 헤더")

    _reject(request, "Tailscale Serve를 거치지 않은 원격 요청")


def _reject(request: Request, reason: str) -> None:
    client = request.client.host if request.client else "unknown"
    logger.warning(
        "인증 실패 (%s): %s %s — %s",
        client,
        request.method,
        request.url.path,
        reason,
    )
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Tailscale에 연결된 허용 기기에서 접속해 주세요.",
        headers={"WWW-Authenticate": "Tailscale"},
    )


RequireDevice = Depends(verify_device)
