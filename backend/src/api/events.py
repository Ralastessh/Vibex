from __future__ import annotations
import asyncio
import logging
import secrets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger("bridge.api.events")
router = APIRouter(tags=["events"])

HEARTBEAT_SECONDS = 25.0

# HTTP 통신 이외에, 백그라운드에서도 PC와의 연결을 유지하기 위하여 Websocket을 사용
def _authorized(websocket: WebSocket, token: str | None) -> bool:
    expected = websocket.app.state.settings.require_device_token()
    header = websocket.headers.get("authorization", "")
    scheme, _, header_token = header.partition(" ")
    candidate = header_token.strip() if scheme.lower() == "bearer" else (token or "")
    return bool(candidate) and secrets.compare_digest(candidate, expected)

@router.websocket("/events")
async def events(websocket: WebSocket, token: str | None = None) -> None:
    if not _authorized(websocket, token):
        client = websocket.client.host if websocket.client else "unknown"
        logger.warning("인증 실패 (%s): WS /events", client)  # §18.12
        await websocket.close(code=1008)
        return

    await websocket.accept()
    broker = websocket.app.state.events
    queue = broker.subscribe()
    try:
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=HEARTBEAT_SECONDS)
            except asyncio.TimeoutError:
                # ping을 보내어 iPad와 PC와의 연결이 끊기지 않도록 함
                await websocket.send_json({"type": "ping"})
                continue
            await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.debug("이벤트 스트림 종료", exc_info=True)
    finally:
        broker.unsubscribe(queue)
