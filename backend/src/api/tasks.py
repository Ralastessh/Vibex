from __future__ import annotations
import asyncio
import logging
from fastapi import APIRouter, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field
from backend.src.agents.prompt import build, build_answer
from backend.src.agents.registry import UnsupportedAgentError, build_adapter
from backend.src.auth.device import RequireDevice
from backend.src.projects.registry import UnknownProjectError
from backend.src.tasks.models import Task, TaskStatus
from backend.src.tasks.runner import interpret_task, run_task
from backend.src.tasks.store import ProjectBusyError
from backend.src.vision.validate import UnsafeCommandError, is_confident_enough, validate

logger = logging.getLogger("bridge.api.tasks")

router = APIRouter(prefix="/tasks", tags=["tasks"], dependencies=[RequireDevice])

class TaskCreated(BaseModel):
    task_id: str = Field(alias="taskId")
    status: TaskStatus

    model_config = {"populate_by_name": True, "serialize_by_alias": True}

def _project(request: Request, project_id: str):
    try:
        return request.app.state.registry.resolve(project_id)
    except UnknownProjectError:
        raise HTTPException(
            status_code=404, detail="선택한 프로젝트가 iMac에 등록되어 있지 않습니다."
        ) from None

def _track(request: Request, coro) -> None:
    task = asyncio.create_task(coro)
    running: set = request.app.state.running
    running.add(task)
    task.add_done_callback(running.discard)

def _adapter_for(request: Request, project):
    injected = getattr(request.app.state, "adapter", None)
    if injected is not None:
        return injected
    try:
        return build_adapter(project.agent, request.app.state.settings)
    except UnsupportedAgentError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc

def _spawn(request: Request, task_id: str, project, prompt: str) -> None:
    _track(
        request,
        run_task(
            task_id=task_id,
            project=project,
            prompt=prompt,
            adapter=_adapter_for(request, project),
            store=request.app.state.tasks,
        ),
    )

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp"}

async def _read_image(upload: UploadFile, limit: int, label: str) -> bytes:
    if upload.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"{label}: 지원하지 않는 형식입니다({upload.content_type}).",
        )
    data = await upload.read()
    if not data:
        raise HTTPException(status_code=400, detail=f"{label}: 빈 이미지입니다.")
    if len(data) > limit:  # §18.7 이미지 크기 제한
        raise HTTPException(
            status_code=413,
            detail=f"{label}: 이미지가 너무 큽니다({len(data) // 1024}KB).",
        )
    return data

@router.post("", response_model=TaskCreated, status_code=202)
async def create_task(
    request: Request,
    projectId: str = Form(...),
    mode: str = Form("text"),
    typedNote: str | None = Form(None),
    clientTaskId: str | None = Form(None),
    canvasImage: UploadFile | None = None,
    baseImage: UploadFile | None = None,
) -> TaskCreated:
    project = _project(request, projectId)

    if canvasImage is None and not (typedNote or "").strip():
        raise HTTPException(
            status_code=400, detail="canvasImage 또는 typedNote가 필요합니다."
        )

    settings = request.app.state.settings
    canvas = base = None
    if canvasImage is not None:
        if request.app.state.vision is None:
            raise HTTPException(
                status_code=503,
                detail="드로잉 해석이 설정되지 않았습니다. BRIDGE_OPENAI_API_KEY를 확인하세요.",
            )
        canvas = await _read_image(canvasImage, settings.max_image_bytes, "canvasImage")
        if baseImage is not None:
            base = await _read_image(baseImage, settings.max_image_bytes, "baseImage")

    if not project.exists:
        raise HTTPException(status_code=409, detail="저장소 경로를 찾을 수 없습니다.")
    if not project.is_git_repo:
        raise HTTPException(status_code=409, detail="Git 저장소가 아닙니다.")

    try:
        task = request.app.state.tasks.create(projectId, client_task_id=clientTaskId)
    except ProjectBusyError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    if task.status is not TaskStatus.QUEUED:
        return TaskCreated(taskId=task.task_id, status=task.status)

    if canvas is not None:
        _track(
            request,
            interpret_task(
                task_id=task.task_id,
                canvas_image=canvas,
                base_image=base,
                typed_note=typedNote,
                provider=request.app.state.vision,
                store=request.app.state.tasks,
            ),
        )
    else:
        prompt = build(
            [typedNote.strip()], resumed=True, test_commands=project.test_commands
        )
        _spawn(request, task.task_id, project, prompt)
    return TaskCreated(taskId=task.task_id, status=task.status)


class ConfirmRequest(BaseModel):
    approved: bool

@router.post("/{task_id}/confirm", response_model=TaskCreated)
async def confirm(task_id: str, body: ConfirmRequest, request: Request) -> TaskCreated:
    store = request.app.state.tasks
    task = store.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
    if task.status is not TaskStatus.AWAITING_CONFIRMATION or task.interpretation is None:
        raise HTTPException(status_code=409, detail="승인을 기다리는 상태가 아닙니다.")

    if not body.approved:
        return TaskCreated(
            taskId=task_id,
            status=store.update(task_id, status=TaskStatus.CANCELLED).status,
        )

    command = task.interpretation
    if not is_confident_enough(command):
        # 사용자가 전달한 그림이 부정확하면 PC 측에서 재요청
        raise HTTPException(
            status_code=409,
            detail=(
                f"해석 신뢰도가 낮습니다({command.overall_confidence:.2f}). "
                "다시 그리거나 설명을 추가해 주세요."
            ),
        )
    try:
        validate(command)
    except UnsafeCommandError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    project = _project(request, task.project_id)
    prompt = build(
        command.to_requests(),
        resumed=True,
        context=f"사용자가 iPad에서 '{command.target.screen or '현재 화면'}' 위에 수정사항을 표시했다.",
        test_commands=project.test_commands,
    )
    store.update(task_id, status=TaskStatus.RUNNING_AGENT)
    _spawn(request, task_id, project, prompt)
    return TaskCreated(taskId=task_id, status=TaskStatus.RUNNING_AGENT)

class TaskListResponse(BaseModel):
    tasks: list[Task]

@router.get("", response_model=TaskListResponse)
def list_tasks(
    request: Request, projectId: str, limit: int = 30
) -> TaskListResponse:
    _project(request, projectId)
    recent = request.app.state.tasks.recent(projectId, limit=max(1, min(limit, 100)))
    return TaskListResponse(tasks=list(reversed(recent)))


@router.get("/{task_id}", response_model=Task)
def get_task(task_id: str, request: Request) -> Task:
    task = request.app.state.tasks.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
    return task


class AnswerRequest(BaseModel):
    question_id: str = Field(alias="questionId")
    selected_option_id: str = Field(alias="selectedOptionId")
    free_text: str | None = Field(default=None, alias="freeText")

    model_config = {"populate_by_name": True}


@router.post("/{task_id}/answer", response_model=TaskCreated)
async def answer(task_id: str, body: AnswerRequest, request: Request) -> TaskCreated:
    store = request.app.state.tasks
    task = store.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
    if task.status is not TaskStatus.AWAITING_CONFIRMATION:
        raise HTTPException(status_code=409, detail="답변을 기다리는 상태가 아닙니다.")

    question = next(
        (q for q in task.questions if q.question_id == body.question_id), None
    )
    if question is None:
        raise HTTPException(status_code=404, detail="해당 질문이 없습니다.")

    option = next(
        (o for o in question.options if o.option_id == body.selected_option_id), None
    )
    if option is None and not (body.free_text or "").strip():
        raise HTTPException(status_code=400, detail="선택지 또는 freeText가 필요합니다.")

    project = _project(request, task.project_id)
    label = option.label if option else body.free_text.strip()

    store.update(task_id, status=TaskStatus.RUNNING_AGENT, questions=[])
    _spawn(request, task_id, project, build_answer(question.text, label))
    return TaskCreated(taskId=task_id, status=TaskStatus.RUNNING_AGENT)


@router.post("/{task_id}/cancel", response_model=Task)
def cancel(task_id: str, request: Request) -> Task:
    store = request.app.state.tasks
    task = store.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
    if not task.is_active:
        raise HTTPException(status_code=409, detail="이미 끝난 작업입니다.")
    return store.update(
        task_id,
        status=TaskStatus.CANCELLED,
        warnings=[*task.warnings, "사용자가 취소했습니다. 이미 변경된 파일은 되돌리지 않았습니다."],
    )
