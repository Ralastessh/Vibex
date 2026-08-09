from __future__ import annotations
from typing import Literal
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from src.auth.device import RequireDevice
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
    # iPad가 프로젝트 이름을 보내면, PC에서는 작업 경로의 절대주소와 결합하고 비교
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
        # §20 Unknown Project — 등록 여부를 넘어선 정보는 주지 않는다.
        raise HTTPException(
            status_code=404,
            detail="선택한 프로젝트가 iMac에 등록되어 있지 않습니다.",
        ) from None
    return _view(project, request)


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

    host = request.app.state.settings.preview_public_host.strip() or request.url.hostname
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
