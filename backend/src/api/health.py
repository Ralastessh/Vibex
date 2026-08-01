from __future__ import annotations
from fastapi import APIRouter, Request

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
