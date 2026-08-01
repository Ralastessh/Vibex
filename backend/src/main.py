"""Desktop Bridge (CLAUDE.md §2.1).

새로운 개발 에이전트가 아니다. iPad 요청을 받아 등록된 프로젝트의 기존
Claude Code 세션으로 중계하고, 결과를 돌려주는 얇은 계층이다.

실행:
    BRIDGE_DEVICE_TOKEN=... uvicorn bridge.main:app --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from api import agents, events, health, projects
from fastapi import FastAPI

from agents.registry import available_agents
from api import tasks
from config.settings import Settings, get_settings
from projects.registry import ProjectRegistry
from tasks.events import EventBroker, status_event
from tasks.store import TaskStore
from vision.openai import OpenAIVisionProvider

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("bridge")

API_PREFIX = "/api/v1"


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # 무인증 노출을 막는다(§18.14). 토큰이 없으면 여기서 뜨지 않는다.
        settings.require_device_token()

        app.state.settings = settings
        app.state.registry = ProjectRegistry.load(settings.projects_file)
        app.state.events = EventBroker()
        # 모든 상태 전이가 update를 지나므로 여기서 발행하면 이벤트를 놓치지 않는다(§12.8).
        app.state.tasks = TaskStore(
            settings.database_path,
            on_change=lambda task: app.state.events.publish(
                status_event(task.task_id, task.project_id, task.status.value)
            ),
        )
        # 어댑터는 프로젝트별 agent 설정에 따라 요청 시 만든다(§9.1).
        # 테스트가 여기에 가짜를 끼워 넣으면 그것이 우선한다.
        app.state.adapter = None
        # §8 드로잉 해석. 키가 없으면 텍스트 명령만 동작한다 — 서버는 뜬다.
        app.state.vision = (
            OpenAIVisionProvider(
                settings.openai_api_key,
                model=settings.vision_model,
                timeout=settings.vision_timeout_seconds,
            )
            if settings.openai_api_key.strip()
            else None
        )
        if app.state.vision is None:
            logger.warning("BRIDGE_OPENAI_API_KEY 없음 — 드로잉 해석이 비활성입니다.")

        # 실행 중인 백그라운드 작업 참조를 붙잡아 둔다. 놓으면 GC가 취소해 버린다.
        app.state.running = set()

        usable = [a.display_name for a in available_agents(settings.claude_binary) if a.usable]
        logger.info("사용 가능한 에이전트: %s", ", ".join(usable) or "(없음)")
        if settings.workspace_root is None:
            logger.warning(
                "BRIDGE_WORKSPACE_ROOT 없음 — iPad에서 새 프로젝트를 만들 수 없습니다."
            )

        enabled = app.state.registry.list_enabled()
        logger.info("등록된 프로젝트 %d개: %s", len(enabled),
                    ", ".join(p.project_id for p in enabled) or "(없음)")
        for project in enabled:
            if not project.exists:
                logger.warning("%s: 경로 없음 — %s", project.project_id, project.repo_path)
            elif not project.is_git_repo:
                logger.warning("%s: Git 저장소 아님 — %s", project.project_id, project.repo_path)
        try:
            yield
        finally:
            app.state.tasks.close()

    app = FastAPI(
        title="Cross-Device CLI Bridge",
        version="0.1.0",
        description="iPad의 개발 의도를 iMac의 기존 CLI 세션으로 중계한다.",
        lifespan=lifespan,
    )

    app.include_router(health.router, prefix=API_PREFIX)
    app.include_router(agents.router, prefix=API_PREFIX)
    app.include_router(projects.router, prefix=API_PREFIX)
    app.include_router(tasks.router, prefix=API_PREFIX)
    app.include_router(events.router, prefix=API_PREFIX)
    return app


app = create_app()
