"""프로젝트 목록과 Codex 대화 기록, 미리보기 서버를 다루는 API. 대화를 읽거나 바꾸기 전에는 현재 프로젝트에서 만든 대화가 맞는지도 확인"""
from __future__ import annotations
from typing import Any, Literal
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field
from src.agents.codex_app_server import (
    CodexAppServerError,
    CodexAppServerUnavailable,
)
from src.agents.codex_cli import CodexCLIAdapter, CodexThreadOutsideProjectError
from src.agents.registry import available_agents, build_adapter
from src.auth.device import RequireDevice
from src.api.health import tailscale_self_dns_name
from src.projects.registry import (
    DuplicateProjectError,
    Project,
    UnknownProjectError,
)
from src.projects.workspace import (
    InvalidProjectNameError,
    WorkspaceNotConfiguredError,
)
from src.projects.workspace import create_project as create_in_workspace
from src.projects.preview import (
    PreviewStartError,
    PreviewUnavailableError,
    public_url,
)

router = APIRouter(prefix="/projects", tags=["projects"], dependencies=[RequireDevice])
ProjectStatus = Literal["idle", "busy", "unavailable"]

# PC의 작업 중인 폴더들 정보
class ProjectView(BaseModel):
    project_id: str = Field(alias="projectId")
    display_name: str = Field(alias="displayName")
    status: ProjectStatus
    active_task_id: str | None = Field(default=None, alias="activeTaskId")
    # 만약 접속이 실패할 경우의 이유 설명(ex. 저장소가 없거나 Git이 아니면 작업을 실행할 수 없는 경우)
    reason: str | None = None
    agent: str
    preview_available: bool = Field(alias="previewAvailable")

    model_config = {"populate_by_name": True, "serialize_by_alias": True}

class ProjectListResponse(BaseModel):
    projects: list[ProjectView]

def _view(project: Project, request: Request) -> ProjectView:
    if not project.exists:
        return ProjectView(
            projectId=project.project_id,
            displayName=project.display_name,
            status="unavailable",
            reason="저장소 경로를 찾을 수 없습니다.", agent=project.agent,
            previewAvailable=False)
    if not project.is_git_repo:
        return ProjectView(
            projectId=project.project_id,
            displayName=project.display_name,
            status="unavailable",
            reason="Git 저장소가 아닙니다.", agent=project.agent,
            previewAvailable=False)

    active = request.app.state.tasks.active_task(project.project_id)
    return ProjectView(
        projectId=project.project_id,
        displayName=project.display_name,
        status="busy" if active else "idle",
        activeTaskId=active.task_id if active else None,
        agent=project.agent,
        previewAvailable=request.app.state.previews.can_preview(project))

@router.get("", response_model=ProjectListResponse)
def list_projects(request: Request) -> ProjectListResponse:
    registry = request.app.state.registry
    return ProjectListResponse(
        projects=[_view(p, request) for p in registry.list_enabled()])

class CreateProjectRequest(BaseModel):
    # iPad가 프로젝트 이름을 보내면 PC에서는 작업 경로의 절대주소와 결합하고 비교
    display_name: str = Field(alias="displayName", min_length=1, max_length=80)
    agent: str = "claude-code"
    test_commands: list[str] = Field(default_factory=list, alias="testCommands")
    preview_command: list[str] = Field(default_factory=list, alias="previewCommand")
    preview_port: int | None = Field(default=None, alias="previewPort", ge=1024, le=65535)
    model_config = {"populate_by_name": True}

@router.post("", response_model=ProjectView, status_code=201)
def create_project(body: CreateProjectRequest, request: Request) -> ProjectView:
    settings = request.app.state.settings
    registry = request.app.state.registry

    try:
        project = create_in_workspace(
            body.display_name,
            workspace_root=settings.workspace_root,
            agent=body.agent,
            test_commands=body.test_commands,
            preview_command=body.preview_command,
            preview_port=body.preview_port,
        )
    except WorkspaceNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except InvalidProjectNameError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        registry.add(project)
    except DuplicateProjectError as exc:
        raise HTTPException(
            status_code=409, detail=f"이미 등록된 프로젝트입니다: {project.project_id}"
        ) from exc

    return _view(project, request)

@router.get("/{project_id}", response_model=ProjectView)
def get_project(project_id: str, request: Request) -> ProjectView:
    try:
        project = request.app.state.registry.resolve(project_id)
    except UnknownProjectError:
        raise HTTPException(
            status_code=404,
            detail="선택한 프로젝트가 iMac에 등록되어 있지 않습니다.",
        ) from None
    return _view(project, request)

class UpdateProjectRequest(BaseModel):
    agent: str

@router.patch("/{project_id}", response_model=ProjectView)
def update_project(
    project_id: str, body: UpdateProjectRequest, request: Request
) -> ProjectView:
    registry = request.app.state.registry
    try:
        project = registry.resolve(project_id)
    except UnknownProjectError:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.") from None

    if request.app.state.tasks.active_task(project_id) is not None:
        raise HTTPException(
            status_code=409,
            detail="진행 중인 작업이 끝난 뒤 에이전트를 변경해 주세요.",
        )

    settings = request.app.state.settings
    selected = next(
        (
            candidate
            for candidate in available_agents(
                settings.claude_binary, settings.codex_binary
            )
            if candidate.agent_id == body.agent
        ),
        None,
    )
    if selected is None or not selected.verified:
        raise HTTPException(status_code=400, detail="지원하지 않는 에이전트입니다.")
    if not selected.installed:
        raise HTTPException(
            status_code=409,
            detail=f"{selected.display_name} CLI가 PC에 설치되어 있지 않습니다.",
        )

    project = registry.set_agent(project_id, body.agent)
    return _view(project, request)


class ThreadSummaryView(BaseModel):
    thread_id: str = Field(alias="threadId")
    session_id: str = Field(alias="sessionId")
    name: str | None = None
    preview: str = ""
    source: str = "unknown"
    created_at: int | None = Field(default=None, alias="createdAt")
    updated_at: int | None = Field(default=None, alias="updatedAt")
    recency_at: int | None = Field(default=None, alias="recencyAt")

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class ThreadPage(BaseModel):
    threads: list[ThreadSummaryView]
    next_cursor: str | None = Field(default=None, alias="nextCursor")

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class ThreadDetail(ThreadSummaryView):
    turns: list[dict[str, Any]] = Field(default_factory=list)


class RenameThreadRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)


def _codex_adapter(request: Request, project: Project) -> CodexCLIAdapter:
    if project.agent != "codex-cli":
        raise HTTPException(
            status_code=501,
            detail="대화 이력은 현재 Codex App Server 프로젝트에서만 지원합니다.",
        )
    injected = getattr(request.app.state, "adapter", None)
    adapter = injected if isinstance(injected, CodexCLIAdapter) else build_adapter(
        project.agent, request.app.state.settings
    )
    if not isinstance(adapter, CodexCLIAdapter):
        raise HTTPException(status_code=501, detail="Codex App Server를 사용할 수 없습니다.")
    return adapter


def _thread_summary(raw: dict[str, Any]) -> ThreadSummaryView:
    thread_id = str(raw.get("id") or "")
    if not thread_id:
        raise ValueError("Codex thread id가 없습니다.")
    return ThreadSummaryView(
        threadId=thread_id,
        sessionId=str(raw.get("sessionId") or thread_id),
        name=raw.get("name") if isinstance(raw.get("name"), str) else None,
        preview=str(raw.get("preview") or ""),
        source=str(raw.get("source") or "unknown"),
        createdAt=raw.get("createdAt") if isinstance(raw.get("createdAt"), int) else None,
        updatedAt=raw.get("updatedAt") if isinstance(raw.get("updatedAt"), int) else None,
        recencyAt=raw.get("recencyAt") if isinstance(raw.get("recencyAt"), int) else None,
    )


def _thread_error(exc: Exception) -> HTTPException:
    if isinstance(exc, CodexThreadOutsideProjectError):
        return HTTPException(status_code=404, detail="이 프로젝트의 대화를 찾을 수 없습니다.")
    if isinstance(exc, CodexAppServerUnavailable):
        return HTTPException(status_code=503, detail=str(exc))
    return HTTPException(status_code=502, detail=f"Codex 대화 이력을 읽지 못했습니다: {exc}")


@router.get("/{project_id}/threads", response_model=ThreadPage)
async def list_project_threads(
    project_id: str,
    request: Request,
    cursor: str | None = None,
    limit: int = 30,
    search: str | None = None,
    archived: bool = False,
) -> ThreadPage:
    project = _project_for_threads(request, project_id)
    try:
        page = await _codex_adapter(request, project).list_threads(
            project.repo_path,
            cursor=cursor,
            limit=max(1, min(limit, 100)),
            search_term=(search or "").strip() or None,
            archived=archived,
        )
        threads = [_thread_summary(item) for item in page.get("data", [])]
    except (CodexAppServerError, CodexThreadOutsideProjectError, ValueError) as exc:
        raise _thread_error(exc) from exc
    return ThreadPage(threads=threads, nextCursor=page.get("nextCursor"))


@router.get("/{project_id}/threads/{thread_id}", response_model=ThreadDetail)
async def get_project_thread(
    project_id: str, thread_id: str, request: Request
) -> ThreadDetail:
    project = _project_for_threads(request, project_id)
    try:
        raw = await _codex_adapter(request, project).read_thread(
            project.repo_path, thread_id, include_turns=True
        )
        summary = _thread_summary(raw)
    except (CodexAppServerError, CodexThreadOutsideProjectError, ValueError) as exc:
        raise _thread_error(exc) from exc
    return ThreadDetail(
        **summary.model_dump(by_alias=True),
        turns=[item for item in raw.get("turns", []) if isinstance(item, dict)],
    )

@router.patch("/{project_id}/threads/{thread_id}", status_code=204)
async def rename_project_thread(
    project_id: str,
    thread_id: str,
    body: RenameThreadRequest,
    request: Request,
) -> Response:
    project = _project_for_threads(request, project_id)
    try:
        await _codex_adapter(request, project).set_thread_name(
            project.repo_path, thread_id, body.name.strip()
        )
    except (CodexAppServerError, CodexThreadOutsideProjectError) as exc:
        raise _thread_error(exc) from exc
    return Response(status_code=204)

@router.post("/{project_id}/threads/{thread_id}/archive", status_code=204)
async def archive_project_thread(
    project_id: str, thread_id: str, request: Request
) -> Response:
    project = _project_for_threads(request, project_id)
    try:
        await _codex_adapter(request, project).archive_thread(
            project.repo_path, thread_id
        )
    except (CodexAppServerError, CodexThreadOutsideProjectError) as exc:
        raise _thread_error(exc) from exc
    return Response(status_code=204)

def _project_for_threads(request: Request, project_id: str) -> Project:
    try:
        project = request.app.state.registry.resolve(project_id)
    except UnknownProjectError:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.") from None
    if not project.exists or not project.is_git_repo:
        raise HTTPException(status_code=409, detail="실행 가능한 Git 프로젝트가 아닙니다.")
    return project

class PreviewView(BaseModel):
    project_id: str = Field(alias="projectId")
    url: str
    port: int
    model_config = {"populate_by_name": True, "serialize_by_alias": True}

@router.post("/{project_id}/preview", response_model=PreviewView)
async def start_preview(project_id: str, request: Request) -> PreviewView:
    try:
        project = request.app.state.registry.resolve(project_id)
    except UnknownProjectError:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.") from None
    if not project.exists or not project.is_git_repo:
        raise HTTPException(status_code=409, detail="실행 가능한 Git 프로젝트가 아닙니다.")

    # Tailscale Serve를 통해 들어온 iPad 앱에는 MagicDNS 호스트를, 시뮬레이터/VS Code에는 요청의 localhost를 사용
    configured_host = request.app.state.settings.preview_public_host.strip()
    tailscale_login = request.headers.get("tailscale-user-login", "").strip()
    requested_host = request.url.hostname
    canonical_tailscale_host = (
        tailscale_self_dns_name()
        if requested_host not in {None, "127.0.0.1", "localhost", "testserver"}
        else None
    )
    host = (
        configured_host
        if configured_host and tailscale_login
        else canonical_tailscale_host or requested_host
    )
    if not host:
        raise HTTPException(status_code=500, detail="iPad에서 접근할 PC 호스트를 결정하지 못했습니다.")
    try:
        session = await request.app.state.previews.start(project, public_host=host)
    except PreviewUnavailableError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except PreviewStartError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return PreviewView(
        projectId=project.project_id,
        url=public_url(host, session.port),
        port=session.port,
    )

@router.delete("/{project_id}/preview", status_code=204)
async def stop_preview(project_id: str, request: Request) -> None:
    try:
        request.app.state.registry.resolve(project_id)
    except UnknownProjectError:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.") from None
    await request.app.state.previews.stop(project_id)
