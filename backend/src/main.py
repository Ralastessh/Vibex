from __future__ import annotations
import asyncio
import logging
from contextlib import asynccontextmanager
from src.api import agents, conversations, events, health, projects
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from src.agents.registry import available_agents
from src.api import tasks
from src.config.settings import Settings, get_settings
from src.projects.registry import ProjectRegistry
from src.projects.preview import PreviewManager
from src.tasks.events import EventBroker, status_event
from src.tasks.assets import TaskAssetStore
from src.tasks.store import TaskStore

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("bridge")

API_PREFIX = "/api/v1"

def create_app(settings: Settings | None = None) -> FastAPI:
    """전달받은 설정으로 새 FastAPI 객체 생성 -> 파일이나 프로세스를 쓰는 객체는 서버 시작 때 만들고 종료할 때 정리"""
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.settings = settings
        app.state.registry = ProjectRegistry.load(
            settings.projects_file, workspace_root=settings.workspace_root
        )
        app.state.previews = PreviewManager(
            start_timeout=settings.preview_start_timeout_seconds
        )
        app.state.events = EventBroker()
        app.state.task_assets = TaskAssetStore(settings.task_assets_root)
        app.state.tasks = TaskStore(
            on_change=lambda task: app.state.events.publish(
                status_event(task.task_id, task.project_id, task.status.value)
            ),
            path=settings.conversation_store_file,
            context_recent_tokens=settings.shared_context_recent_tokens,
            context_summary_tokens=settings.shared_context_summary_tokens,
        )
        app.state.adapter = None
        app.state.running = {}

        usable = [
            a.display_name for a in available_agents(
                settings.claude_binary, settings.codex_binary
            ) if a.usable
        ]
        logger.info("사용 가능한 에이전트: %s", ", ".join(usable) or "(없음)")
        if settings.workspace_root is None:
            logger.warning(
                "BRIDGE_WORKSPACE_ROOT 없음 — 프로젝트 자동 탐색과 "
                "iPad에서의 새 프로젝트 생성이 비활성화됩니다."
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
            running = list(app.state.running.values())
            for task in running:
                task.cancel()
            if running:
                await asyncio.gather(*running, return_exceptions=True)
            await app.state.previews.close()
            app.state.tasks.close()
            app.state.task_assets.cleanup_all()

    app = FastAPI(
        title="Cross-Device CLI Bridge",
        version="0.1.0",
        description="iPad의 개발 의도를 iMac의 기존 CLI 세션으로 중계한다.",
        lifespan=lifespan,
    )

    @app.middleware("http")
    async def limit_upload_size(request, call_next):
        declared = request.headers.get("content-length")
        if declared and declared.isdigit() and int(declared) > settings.max_upload_bytes:
            limit_mb = settings.max_upload_bytes // (1024 * 1024)
            logger.warning("본문이 너무 큼: %s bytes (%s)", declared, request.url.path)
            return JSONResponse(
                status_code=413,
                content={
                    "detail": f"요청이 너무 큽니다({int(declared) // (1024 * 1024)}MB). "
                              f"상한은 {limit_mb}MB입니다."
                },
            )
        return await call_next(request)

    app.include_router(health.router, prefix=API_PREFIX)
    app.include_router(agents.router, prefix=API_PREFIX)
    app.include_router(projects.router, prefix=API_PREFIX)
    app.include_router(conversations.router, prefix=API_PREFIX)
    app.include_router(tasks.router, prefix=API_PREFIX)
    app.include_router(events.router, prefix=API_PREFIX)
    return app


app = create_app()
