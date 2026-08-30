"""작업 상태가 바뀔 때 앱으로 바로 알려 주는 WebSocket API입니다."""

from __future__ import annotations
import asyncio
import ipaddress
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger("bridge.api.events")
router = APIRouter(tags=["events"])

HEARTBEAT_SECONDS = 25.0

# HTTP 통신 이외에, 백그라운드에서도 PC와의 연결을 유지하기 위하여 Websocket을 사용
def _authorized(websocket: WebSocket) -> bool:
    client = websocket.client.host if websocket.client else "unknown"
    try:
        is_loopback = client.lower() == "localhost" or ipaddress.ip_address(client).is_loopback
    except ValueError:
        is_loopback = False

    tailscale_login = websocket.headers.get("tailscale-user-login", "").strip().lower()
    allowed = websocket.app.state.settings.tailscale_user_allowlist
    if is_loopback:
        return not tailscale_login or not allowed or tailscale_login in allowed

    # localhost 밖에서 직접 넣은 Tailscale 헤더는 신뢰하지 않는다.
    if tailscale_login:
        return False

    return False

@router.websocket("/events")
async def events(websocket: WebSocket) -> None:
    if not _authorized(websocket):
        client = websocket.client.host if websocket.client else "unknown"
        logger.warning("인증 실패 (%s): WS /events", client)  # §18.12
        await websocket.close(code=1008)
        return

    await websocket.accept()
    broker = websocket.app.state.events
    queue = broker.subscribe()
    disconnect_waiter = asyncio.create_task(websocket.receive())
    try:
        while True:
            event_waiter = asyncio.create_task(queue.get())
            try:
                done, _ = await asyncio.wait(
                    {event_waiter, disconnect_waiter},
                    timeout=HEARTBEAT_SECONDS,
                    return_when=asyncio.FIRST_COMPLETED,
                )

                # 송신 전용 스트림이어도 receive를 함께 기다려야 클라이언트가
                # 닫힌 즉시 구독을 해제할 수 있다. 그렇지 않으면 queue.get()의
                # heartbeat 제한 시간만큼 서버 종료와 재연결이 지연된다.
                if disconnect_waiter in done:
                    message = disconnect_waiter.result()
                    if message.get("type") == "websocket.disconnect":
                        break
                    # 클라이언트 메시지는 현재 프로토콜에서 쓰지 않지만, 다음
                    # disconnect를 계속 감지할 수 있도록 receive를 다시 건다.
                    disconnect_waiter = asyncio.create_task(websocket.receive())

                if event_waiter in done:
                    await websocket.send_json(event_waiter.result())
                elif not done:
                    # ping을 보내어 iPad와 PC와의 연결을 유지한다.
                    await websocket.send_json({"type": "ping"})
            finally:
                if not event_waiter.done():
                    event_waiter.cancel()
                await asyncio.gather(event_waiter, return_exceptions=True)
    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    except Exception:
        logger.debug("이벤트 스트림 종료", exc_info=True)
    finally:
        if not disconnect_waiter.done():
            disconnect_waiter.cancel()
        await asyncio.gather(disconnect_waiter, return_exceptions=True)
        broker.unsubscribe(queue)
