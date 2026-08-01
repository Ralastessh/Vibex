from __future__ import annotations
import logging
import secrets
from fastapi import Depends, Header, HTTPException, Request, status

logger = logging.getLogger("bridge.auth")

def verify_device_token(
    request: Request, authorization: str | None = Header(default=None)
) -> None:
    """Authorization: Bearer <device-token>로 검증
    타이밍 공격을 피하기 위해 compare_digest를 쓰고 실패 시 기록
    """
    expected = request.app.state.settings.require_device_token()

    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token:
        _reject(request, "인증 헤더 없음 또는 형식 오류")

    if not secrets.compare_digest(token.strip(), expected):
        _reject(request, "토큰 불일치")

def _reject(request: Request, reason: str) -> None:
    client = request.client.host if request.client else "unknown"
    logger.warning("인증 실패 (%s): %s %s — %s", client, request.method, request.url.path, reason)
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증이 필요합니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )

RequireDevice = Depends(verify_device_token)
