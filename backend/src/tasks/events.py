"""작업 상태가 바뀌면 WebSocket으로 연결된 앱에 알려 줍니다."""

from __future__ import annotations
import asyncio
import logging
from typing import Any

logger = logging.getLogger("bridge.events")

QUEUE_SIZE = 64

class EventBroker:
    """연결된 앱마다 따로 이벤트 대기열을 관리합니다.

    한 앱의 연결이 느리다고 전체 작업이 멈추면 안 되므로 대기열이 가득 차면 그 이벤트는
    건너뜁니다. 놓친 상태가 필요하면 앱에서 작업 조회 API를 다시 호출하면 됩니다.
    """
    def __init__(self) -> None:
        self._subscribers: set[asyncio.Queue] = set()

    def subscribe(self) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue(maxsize=QUEUE_SIZE)
        self._subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue) -> None:
        self._subscribers.discard(queue)

    @property
    def subscriber_count(self) -> int:
        return len(self._subscribers)

    def publish(self, event: dict[str, Any]) -> None:
        """현재 연결된 앱에 이벤트를 보내되 꽉 찬 대기열은 건너뜁니다."""
        for queue in list(self._subscribers):
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                # 진행 표시를 위한 이벤트다. 밀린 것을 버리는 편이 낫다.
                logger.debug("구독자 큐가 가득 차 이벤트를 버립니다: %s", event.get("type"))

def status_event(task_id: str, project_id: str, status: str, message: str = "") -> dict:
    return {
        "type": "task.status",
        "taskId": task_id,
        "projectId": project_id,
        "status": status,
        "message": message or STATUS_MESSAGES.get(status, ""),
    }

STATUS_MESSAGES = {
    "queued": "대기 중입니다.",
    "interpreting": "드로잉을 해석하고 있습니다.",
    "awaiting_confirmation": "해석 결과를 확인해 주세요.",
    "resolving_session": "프로젝트 세션을 찾고 있습니다.",
    "running_agent": "요청을 처리하고 있습니다.",
    "testing": "테스트를 실행하고 있습니다.",
    "completed": "완료되었습니다.",
    "failed": "실패했습니다.",
    "cancelled": "취소되었습니다.",
}
