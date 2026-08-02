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

    model_config = {"populate_by_name": True, "serialize_by_alias": True}

class ProjectListResponse(BaseModel):
    projects: list[ProjectView]

def _view(project: Project, request: Request) -> ProjectView:
    if not project.exists:
        return ProjectView(
            projectId=project.project_id,
            displayName=project.display_name,
            status="unavailable",
            reason="저장소 경로를 찾을 수 없습니다.")
    if not project.is_git_repo:
        return ProjectView(
            projectId=project.project_id,
            displayName=project.display_name,
            status="unavailable",
            reason="Git 저장소가 아닙니다.")

    active = request.app.state.tasks.active_task(project.project_id)
    return ProjectView(
        projectId=project.project_id,
        displayName=project.display_name,
        status="busy" if active else "idle",
        activeTaskId=active.task_id if active else None)

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
