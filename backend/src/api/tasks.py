from __future__ import annotations
import asyncio
import base64
import logging
import mimetypes
from pathlib import Path
from typing import Literal
from fastapi import APIRouter, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from src.agents.prompt import build, build_answer, build_visual
from src.agents.registry import (
    UnsupportedAgentError,
    build_adapter,
    validate_run_options,
)
from src.auth.device import RequireDevice
from src.projects.registry import UnknownProjectError
from src.projects import git
from src.tasks.models import (
    ClarificationTurn,
    ApprovalMode,
    Task,
    TaskAttachment,
    TaskInputReference,
    TaskStatus,
    ThreadMode,
)
from src.tasks.runner import run_task
from src.tasks.store import ProjectBusyError

logger = logging.getLogger("bridge.api.tasks")

router = APIRouter(prefix="/tasks", tags=["tasks"], dependencies=[RequireDevice])

class TaskCreated(BaseModel):
    task_id: str = Field(alias="taskId")
    status: TaskStatus
    conversation_id: str | None = Field(default=None, alias="conversationId")

    model_config = {"populate_by_name": True, "serialize_by_alias": True}

def _project(request: Request, project_id: str):
    try:
        return request.app.state.registry.resolve(project_id)
    except UnknownProjectError:
        raise HTTPException(
            status_code=404, detail="선택한 프로젝트가 iMac에 등록되어 있지 않습니다."
        ) from None

def _track(request: Request, task_id: str, coro) -> None:
    task = asyncio.create_task(coro)
    running: dict[str, asyncio.Task] = request.app.state.running
    running[task_id] = task

    def remove(completed: asyncio.Task) -> None:
        if running.get(task_id) is completed:
            running.pop(task_id, None)

    task.add_done_callback(remove)

def _adapter_for(request: Request, project):
    injected = getattr(request.app.state, "adapter", None)
    if injected is not None:
        return injected
    try:
        return build_adapter(project.agent, request.app.state.settings)
    except UnsupportedAgentError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc

def _spawn(
    request: Request, task_id: str, project, prompt: str,
    session_id: str | None = None,
    image_paths=None,
    model: str | None = None,
    effort: str | None = None,
    speed_mode: str | None = None,
    approval_mode: ApprovalMode = "default",
    thread_mode: ThreadMode = "auto",
) -> None:
    async def run_and_remember_session() -> None:
        try:
            await run_task(
                task_id=task_id,
                project=project,
                prompt=prompt,
                adapter=_adapter_for(request, project),
                store=request.app.state.tasks,
                session_id=session_id,
                image_paths=image_paths,
                model=model,
                effort=effort,
                speed_mode=speed_mode,
                approval_mode=approval_mode,
                thread_mode=thread_mode,
            )
        finally:
            completed = request.app.state.tasks.get(task_id)
            agent_id = completed.agent_id if completed else project.agent
            bound = (
                completed.thread_id or completed.session_id
                if completed and agent_id == "codex-cli"
                else completed.session_id if completed else None
            )
            if bound and agent_id:
                if completed and completed.conversation_id:
                    request.app.state.tasks.bind_agent_session(
                        completed.conversation_id, agent_id, bound
                    )
                # 구버전 클라이언트의 프로젝트 단위 자동 재개도 계속 동작한다.
                request.app.state.registry.set_agent_session(
                    project.project_id, agent_id, bound
                )

    _track(
        request,
        task_id,
        run_and_remember_session(),
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


def _local_reference_images(
    values: list[str], *, project, origin: str, limit: int
) -> list[Path]:
    """Resolve native VS Code Chat image attachments without exposing arbitrary files.

    Only the loopback VS Code client may submit local paths, and every resolved path
    must remain inside the selected project. iPad clients continue to upload bytes.
    """
    if not values:
        return []
    if origin != "vscode":
        raise HTTPException(status_code=403, detail="로컬 이미지 경로는 VS Code에서만 사용할 수 있습니다.")
    if len(values) > 8:
        raise HTTPException(status_code=413, detail="한 요청에는 이미지를 최대 8개까지 첨부할 수 있습니다.")

    root = project.repo_path.resolve()
    resolved: list[Path] = []
    for raw in values:
        try:
            candidate = Path(raw).expanduser().resolve(strict=True)
        except (OSError, RuntimeError):
            raise HTTPException(status_code=404, detail="첨부한 로컬 이미지를 찾을 수 없습니다.") from None
        if root != candidate and root not in candidate.parents:
            raise HTTPException(status_code=403, detail="프로젝트 밖의 이미지는 첨부할 수 없습니다.")
        media_type = mimetypes.guess_type(candidate.name)[0]
        if not candidate.is_file() or media_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=415, detail=f"지원하지 않는 이미지입니다: {candidate.name}")
        if candidate.stat().st_size > limit:
            raise HTTPException(status_code=413, detail=f"이미지가 너무 큽니다: {candidate.name}")
        resolved.append(candidate)
    return resolved


def _input_references(values: list[str], *, project, origin: str) -> list[TaskInputReference]:
    if not values:
        return []
    if origin != "vscode":
        raise HTTPException(status_code=403, detail="로컬 파일 참조는 VS Code에서만 사용할 수 있습니다.")
    if len(values) > 20:
        raise HTTPException(status_code=413, detail="한 요청에는 파일을 최대 20개까지 첨부할 수 있습니다.")

    root = project.repo_path.resolve()
    references: list[TaskInputReference] = []
    seen: set[Path] = set()
    for raw in values:
        try:
            candidate = (root / raw).resolve(strict=True)
        except (OSError, RuntimeError):
            raise HTTPException(status_code=404, detail="첨부한 프로젝트 파일을 찾을 수 없습니다.") from None
        if candidate in seen:
            continue
        if root != candidate and root not in candidate.parents:
            raise HTTPException(status_code=403, detail="프로젝트 밖의 파일은 첨부할 수 없습니다.")
        if not candidate.is_file():
            raise HTTPException(status_code=415, detail="파일만 첨부할 수 있습니다.")
        seen.add(candidate)
        references.append(
            TaskInputReference(
                name=candidate.name,
                relativePath=candidate.relative_to(root).as_posix(),
                kind=(
                    "image"
                    if mimetypes.guess_type(candidate.name)[0] in ALLOWED_IMAGE_TYPES
                    else "file"
                ),
            )
        )
    return references

@router.post("", response_model=TaskCreated, status_code=202)
async def create_task(
    request: Request,
    projectId: str = Form(...),
    conversationId: str | None = Form(None),
    agentId: str | None = Form(None),
    mode: str = Form("text"),
    typedNote: str | None = Form(None),
    origin: Literal["ipad", "vscode"] = Form("ipad"),
    model: str | None = Form(None),
    effort: str | None = Form(None),
    speedMode: str | None = Form(None),
    approvalMode: ApprovalMode = Form("default"),
    clientTaskId: str | None = Form(None),
    threadMode: ThreadMode = Form("auto"),
    threadId: str | None = Form(None),
    localImagePath: list[str] = Form(default=[]),
    inputReference: list[str] = Form(default=[]),
    canvasImage: UploadFile | None = None,
    renderedViewImage: UploadFile | None = None,
    # 이전 iPad 빌드와 한시 호환. 새 앱은 renderedViewImage를 보낸다.
    baseImage: UploadFile | None = None,
) -> TaskCreated:
    project = _project(request, projectId)
    selected_agent = (agentId or project.agent).strip()
    execution_project = project.model_copy(update={"agent": selected_agent})
    store = request.app.state.tasks
    conversation = None
    if conversationId:
        conversation = store.get_conversation(projectId, conversationId)
        if conversation is None:
            raise HTTPException(status_code=404, detail="선택한 VIBEX 대화를 찾을 수 없습니다.")

    normalized_thread_id = (threadId or "").strip() or None
    if threadMode == "resume" and normalized_thread_id is None:
        raise HTTPException(status_code=422, detail="threadMode=resume에는 threadId가 필요합니다.")
    if threadMode == "new" and normalized_thread_id is not None:
        raise HTTPException(status_code=422, detail="새 대화에는 기존 threadId를 지정할 수 없습니다.")
    if conversation is None and selected_agent != "codex-cli" and threadMode != "auto":
        raise HTTPException(
            status_code=501,
            detail="명시적인 네이티브 대화 선택은 현재 Codex App Server에서만 지원합니다.",
        )
    if conversation is not None:
        # 공용 대화 안에서는 모델마다 자기 네이티브 세션만 이어 쓴다. 다른
        # 모델의 이력을 네이티브 세션에 주입하지 않는다.
        normalized_thread_id = conversation.agent_sessions.get(selected_agent)
        threadMode = "auto" if normalized_thread_id else "new"
    elif threadMode == "auto" and normalized_thread_id is None:
        normalized_thread_id = project.agent_sessions.get(selected_agent)

    if canvasImage is None and not (typedNote or "").strip():
        raise HTTPException(
            status_code=400, detail="canvasImage 또는 typedNote가 필요합니다."
        )
    if not project.exists:
        raise HTTPException(status_code=409, detail="저장소 경로를 찾을 수 없습니다.")
    if not project.is_git_repo:
        raise HTTPException(status_code=409, detail="Git 저장소가 아닙니다.")

    settings = request.app.state.settings
    local_image_paths = _local_reference_images(
        localImagePath,
        project=project,
        origin=origin,
        limit=settings.max_image_bytes,
    )
    input_references = _input_references(
        inputReference,
        project=project,
        origin=origin,
    )
    canvas = rendered = None
    canvas_content_type = rendered_content_type = None
    if canvasImage is not None:
        if local_image_paths:
            raise HTTPException(
                status_code=400,
                detail="드로잉 업로드와 VS Code 이미지 첨부는 한 요청에서 함께 사용할 수 없습니다.",
            )
        canvas_content_type = canvasImage.content_type
        canvas = await _read_image(canvasImage, settings.max_image_bytes, "canvasImage")
        rendered_upload = renderedViewImage or baseImage
        if rendered_upload is None:
            raise HTTPException(
                status_code=400,
                detail="라이브 프론트엔드 렌더(renderedViewImage)가 필요합니다.",
            )
        rendered_content_type = rendered_upload.content_type
        rendered = await _read_image(
            rendered_upload, settings.max_image_bytes, "renderedViewImage"
        )

    existing = store.find_by_client_task_id(projectId, clientTaskId)
    if existing is not None:
        return TaskCreated(
            taskId=existing.task_id,
            status=existing.status,
            conversationId=existing.conversation_id,
        )

    # 지원되지 않는 CLI라면 lock을 잡기 전에 거절한다.
    _adapter_for(request, execution_project)

    try:
        agent_model, reasoning_effort, speed_mode = validate_run_options(
            selected_agent, model, effort, speedMode
        )
        user_message = (typedNote or "").strip()
        if canvas is not None and not user_message:
            user_message = "첨부한 화면과 드로잉을 기준으로 수정해줘."
        task = store.create(
            projectId,
            client_task_id=clientTaskId,
            user_message=user_message,
            origin=origin,
            agent_model=agent_model,
            reasoning_effort=reasoning_effort,
            speed_mode=speed_mode,
            approval_mode=approvalMode,
            agent_id=selected_agent,
            thread_mode=threadMode,
            thread_id=normalized_thread_id,
            conversation_id=conversationId,
        )
        if input_references:
            task = store.update(task.task_id, input_references=input_references)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ProjectBusyError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail="선택한 VIBEX 대화를 찾을 수 없습니다.") from exc

    if task.status is not TaskStatus.QUEUED:
        return TaskCreated(
            taskId=task.task_id,
            status=task.status,
            conversationId=task.conversation_id,
        )

    if canvas is not None and rendered is not None:
        try:
            image_paths = request.app.state.task_assets.save(
                task.task_id,
                [
                    ("rendered-view.jpg", rendered),
                    ("drawing-overlay.png", canvas),
                ],
            )
            request.app.state.tasks.update(
                task.task_id,
                attachments=[
                    TaskAttachment(
                        name="rendered-view.jpg",
                        kind="rendered_view",
                        contentType=rendered_content_type or "image/jpeg",
                        url=f"/api/v1/tasks/{task.task_id}/attachments/rendered-view.jpg",
                    ),
                    TaskAttachment(
                        name="drawing-overlay.png",
                        kind="drawing_overlay",
                        contentType=canvas_content_type or "image/png",
                        url=f"/api/v1/tasks/{task.task_id}/attachments/drawing-overlay.png",
                    ),
                ],
            )
        except OSError as exc:
            request.app.state.tasks.update(
                task.task_id, status=TaskStatus.FAILED,
                error=f"이미지를 PC에 저장하지 못했습니다: {exc}",
            )
            raise HTTPException(status_code=500, detail="이미지를 PC에 저장하지 못했습니다.") from exc
        _spawn(
            request,
            task.task_id,
            execution_project,
            build_visual(typed_note=typedNote, test_commands=project.test_commands),
            session_id=task.thread_id,
            image_paths=image_paths,
            model=task.agent_model,
            effort=task.reasoning_effort,
            speed_mode=task.speed_mode,
            approval_mode=task.approval_mode,
            thread_mode=task.thread_mode,
        )
    else:
        persisted_reference_paths: list[Path] = []
        if local_image_paths:
            try:
                reference_assets = [
                    (
                        f"reference-{index}{source.suffix.lower()}",
                        source.read_bytes(),
                    )
                    for index, source in enumerate(local_image_paths, start=1)
                ]
                persisted_reference_paths = request.app.state.task_assets.save(
                    task.task_id,
                    reference_assets,
                )
                request.app.state.tasks.update(
                    task.task_id,
                    attachments=[
                        TaskAttachment(
                            name=name,
                            kind="reference_image",
                            contentType=mimetypes.guess_type(name)[0] or "image/png",
                            url=f"/api/v1/tasks/{task.task_id}/attachments/{name}",
                        )
                        for name, _ in reference_assets
                    ],
                )
            except OSError as exc:
                request.app.state.tasks.update(
                    task.task_id,
                    status=TaskStatus.FAILED,
                    error=f"참조 이미지를 PC에 저장하지 못했습니다: {exc}",
                )
                raise HTTPException(
                    status_code=500,
                    detail="참조 이미지를 PC에 저장하지 못했습니다.",
                ) from exc
        prompt_note = typedNote.strip()
        if input_references:
            prompt_note += "\n\nVS Code에서 첨부한 프로젝트 파일:\n" + "\n".join(
                f"- {reference.relative_path}" for reference in input_references
            )
        prompt = build(
            [prompt_note], resumed=False, test_commands=project.test_commands,
            origin=origin,
        )
        _spawn(
            request, task.task_id, execution_project, prompt,
            session_id=task.thread_id,
            image_paths=persisted_reference_paths or None,
            model=task.agent_model,
            effort=task.reasoning_effort,
            speed_mode=task.speed_mode,
            approval_mode=task.approval_mode,
            thread_mode=task.thread_mode,
        )
    return TaskCreated(
        taskId=task.task_id,
        status=task.status,
        conversationId=task.conversation_id,
    )


class TaskListResponse(BaseModel):
    tasks: list[Task]

@router.get("", response_model=TaskListResponse)
def list_tasks(
    request: Request,
    projectId: str,
    limit: int = 30,
    conversationId: str | None = None,
) -> TaskListResponse:
    _project(request, projectId)
    if conversationId:
        try:
            recent = request.app.state.tasks.recent_for_conversation(
                projectId, conversationId, limit=max(1, min(limit, 200))
            )
        except LookupError:
            raise HTTPException(status_code=404, detail="대화를 찾을 수 없습니다.") from None
    else:
        recent = request.app.state.tasks.recent(projectId, limit=max(1, min(limit, 100)))
    return TaskListResponse(tasks=list(reversed(recent)))


@router.get("/{task_id}", response_model=Task)
def get_task(task_id: str, request: Request) -> Task:
    task = request.app.state.tasks.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
    return task


@router.get("/{task_id}/attachments/{name}")
def get_attachment(task_id: str, name: str, request: Request) -> FileResponse:
    task = request.app.state.tasks.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
    attachment = next((item for item in task.attachments if item.name == name), None)
    path = request.app.state.task_assets.resolve(task_id, name)
    if attachment is None or path is None:
        raise HTTPException(status_code=404, detail="첨부 이미지를 찾을 수 없습니다.")
    return FileResponse(path, media_type=attachment.content_type)


class ReviewFile(BaseModel):
    path: str
    absolute_path: str | None = Field(default=None, alias="absolutePath")
    additions: int = 0
    deletions: int = 0

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class TaskReview(BaseModel):
    patch: str
    files: list[ReviewFile]


class TaskReviewFile(BaseModel):
    path: str
    before: str | None
    after: str | None
    before_exists: bool = Field(alias="beforeExists")
    after_exists: bool = Field(alias="afterExists")
    content_type: str | None = Field(default=None, alias="contentType")
    is_binary: bool = Field(default=False, alias="isBinary")
    encoding: Literal["utf-8", "base64"] = "utf-8"

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


@router.get("/{task_id}/review", response_model=TaskReview)
def review_task(task_id: str, request: Request) -> TaskReview:
    task = request.app.state.tasks.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
    patch = request.app.state.tasks.review_patch(task_id)
    if not patch:
        raise HTTPException(status_code=409, detail="이 작업에는 리뷰할 파일 변경이 없습니다.")
    project = _project(request, task.project_id)
    root = project.repo_path.resolve()
    files: list[ReviewFile] = []
    for changed in task.changed_files:
        candidate = (root / changed.path).resolve()
        is_inside = candidate == root or root in candidate.parents
        files.append(
            ReviewFile(
                path=changed.path,
                absolutePath=str(candidate) if is_inside and candidate.exists() else None,
                additions=changed.additions,
                deletions=changed.deletions,
            )
        )
    return TaskReview(patch=patch, files=files)


def _binary(data: bytes | None) -> bool:
    if data is None:
        return False
    if b"\0" in data:
        return True
    try:
        data.decode("utf-8")
    except UnicodeDecodeError:
        return True
    return False


def _review_content(data: bytes | None, *, binary: bool) -> str | None:
    if data is None:
        return None
    if binary:
        return base64.b64encode(data).decode("ascii")
    return data.decode("utf-8")


@router.get("/{task_id}/review/file", response_model=TaskReviewFile)
def review_task_file(task_id: str, path: str, request: Request) -> TaskReviewFile:
    store = request.app.state.tasks
    task = store.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
    if not any(changed.path == path for changed in task.changed_files):
        raise HTTPException(status_code=404, detail="이 작업에서 변경한 파일이 아닙니다.")

    trees = store.review_trees(task_id)
    if trees is None:
        raise HTTPException(
            status_code=409,
            detail="이 작업에는 파일 전후 스냅샷이 없습니다.",
        )
    project = _project(request, task.project_id)
    try:
        before_data = git.read_tree_file(project.repo_path, trees[0], path)
        after_data = git.read_tree_file(project.repo_path, trees[1], path)
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    is_binary = _binary(before_data) or _binary(after_data)
    guessed_type = mimetypes.guess_type(path)[0]
    content_type = guessed_type or (
        "application/octet-stream" if is_binary else "text/plain"
    )
    return TaskReviewFile(
        path=path,
        before=_review_content(before_data, binary=is_binary),
        after=_review_content(after_data, binary=is_binary),
        beforeExists=before_data is not None,
        afterExists=after_data is not None,
        contentType=content_type,
        isBinary=is_binary,
        encoding="base64" if is_binary else "utf-8",
    )


@router.post("/{task_id}/undo", response_model=Task)
def undo_task(task_id: str, request: Request) -> Task:
    store = request.app.state.tasks
    task = store.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
    if task.is_active:
        raise HTTPException(status_code=409, detail="작업이 끝난 뒤 실행 취소할 수 있습니다.")
    if task.undone:
        raise HTTPException(status_code=409, detail="이미 실행 취소한 작업입니다.")
    patch = store.review_patch(task_id)
    if not patch:
        raise HTTPException(status_code=409, detail="되돌릴 파일 변경이 없습니다.")
    project = _project(request, task.project_id)
    try:
        git.reverse_patch(project.repo_path, patch)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=409,
            detail="후속 변경과 충돌하여 안전하게 실행 취소할 수 없습니다. 리뷰에서 직접 확인해 주세요.",
        ) from exc
    return store.update(task_id, undone=True)


class AnswerRequest(BaseModel):
    question_id: str = Field(alias="questionId")
    selected_option_id: str | None = Field(default=None, alias="selectedOptionId")
    free_text: str | None = Field(default=None, alias="freeText")

    model_config = {"populate_by_name": True}


@router.post("/{task_id}/answer", response_model=TaskCreated)
async def answer(task_id: str, body: AnswerRequest, request: Request) -> TaskCreated:
    store = request.app.state.tasks
    task = store.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
    if task.origin != "ipad":
        raise HTTPException(
            status_code=409,
            detail="선택지 응답은 iPad 작업에서만 사용합니다. VS Code에서는 일반 후속 메시지를 보내세요.",
        )
    if task.status is not TaskStatus.AWAITING_CONFIRMATION:
        raise HTTPException(status_code=409, detail="답변을 기다리는 상태가 아닙니다.")

    question = next(
        (q for q in task.questions if q.question_id == body.question_id), None
    )
    if question is None:
        raise HTTPException(status_code=404, detail="해당 질문이 없습니다.")

    option = next(
        (o for o in question.options if o.option_id == body.selected_option_id), None
    ) if body.selected_option_id else None
    if option is None and not (body.free_text or "").strip():
        raise HTTPException(status_code=400, detail="선택지 또는 freeText가 필요합니다.")

    project = _project(request, task.project_id)
    label = option.label if option else body.free_text.strip()

    store.update(
        task_id,
        status=TaskStatus.RUNNING_AGENT,
        questions=[],
        clarification_turns=[
            *task.clarification_turns,
            ClarificationTurn(
                question=question,
                answer=label,
                assistantReply=task.agent_reply or "",
                selectedOptionId=option.option_id if option else None,
            ),
        ],
    )
    # 되물은 그 세션에 답해야 한다. 다시 찾으면 엉뚱한 대화로 갈 수 있다.
    run_project = project.model_copy(update={"agent": task.agent_id or project.agent})
    _spawn(
        request, task_id, run_project, build_answer(question.text, label),
        session_id=task.session_id or None,
        model=task.agent_model,
        effort=task.reasoning_effort,
        speed_mode=task.speed_mode,
        approval_mode=task.approval_mode,
    )
    return TaskCreated(
        taskId=task_id,
        status=TaskStatus.RUNNING_AGENT,
        conversationId=task.conversation_id,
    )


@router.post("/{task_id}/regenerate", response_model=TaskCreated, status_code=202)
async def regenerate(task_id: str, request: Request) -> TaskCreated:
    """같은 로컬 세션에서 직전 요청을 다시 수행한다.

    별도의 가짜 UI 동작이 아니라 새 Task/turn을 만들고 동일 thread를 정확히
    재개한다. 시각 요청의 이미지도 이전 thread context에 남아 있으므로 재업로드
    없이 같은 요청을 다시 판단할 수 있다.
    """
    store = request.app.state.tasks
    original = store.get(task_id)
    if original is None:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
    if original.is_active:
        raise HTTPException(status_code=409, detail="작업이 끝난 뒤 다시 생성할 수 있습니다.")
    agent_id = original.agent_id or _project(request, original.project_id).agent
    thread_id = (
        original.thread_id or original.session_id
        if agent_id == "codex-cli"
        else original.session_id or original.thread_id
    )
    if not thread_id:
        raise HTTPException(status_code=409, detail="다시 생성할 로컬 대화 세션이 없습니다.")

    project = _project(request, original.project_id)
    run_project = project.model_copy(update={"agent": agent_id})
    _adapter_for(request, run_project)
    try:
        regenerated = store.create(
            original.project_id,
            client_task_id=None,
            user_message=original.user_message,
            origin="vscode",
            agent_model=original.agent_model,
            reasoning_effort=original.reasoning_effort,
            speed_mode=original.speed_mode,
            approval_mode=original.approval_mode,
            agent_id=agent_id,
            regenerated_from_task_id=original.task_id,
            thread_mode="resume",
            thread_id=thread_id,
            conversation_id=original.conversation_id,
        )
        if original.input_references:
            regenerated = store.update(
                regenerated.task_id,
                input_references=original.input_references,
            )
    except ProjectBusyError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    prompt = build(
        [
            "직전 사용자 요청에 대한 답변을 처음부터 다시 생성한다. "
            "기존 답변을 그대로 반복하지 말고 현재 프로젝트 상태를 다시 확인한다.\n\n"
            f"원래 사용자 요청: {original.user_message}"
        ],
        resumed=True,
        test_commands=run_project.test_commands,
    )
    _spawn(
        request,
        regenerated.task_id,
        run_project,
        prompt,
        session_id=thread_id,
        model=regenerated.agent_model,
        effort=regenerated.reasoning_effort,
        speed_mode=regenerated.speed_mode,
        approval_mode=regenerated.approval_mode,
        thread_mode="resume",
    )
    return TaskCreated(
        taskId=regenerated.task_id,
        status=regenerated.status,
        conversationId=regenerated.conversation_id,
    )


@router.post("/{task_id}/cancel", response_model=Task)
async def cancel(task_id: str, request: Request) -> Task:
    store = request.app.state.tasks
    task = store.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
    if not task.is_active:
        raise HTTPException(status_code=409, detail="이미 끝난 작업입니다.")
    running: asyncio.Task | None = request.app.state.running.get(task_id)
    if running is not None and not running.done():
        running.cancel()
        # adapter의 subprocess finally가 끝날 때까지 프로젝트 lock을 유지한다.
        # 먼저 CANCELLED로 바꾸면 종료 중인 프로세스와 새 작업이 동시에 파일을
        # 수정할 수 있다.
        try:
            await running
        except asyncio.CancelledError:
            pass

    latest = store.get(task_id)
    if latest is None:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
    if latest.status is TaskStatus.CANCELLED:
        return latest
    if not latest.is_active:
        return latest
    return store.update(
        task_id,
        status=TaskStatus.CANCELLED,
        warnings=[
            *latest.warnings,
            "사용자가 취소했습니다. 이미 변경된 파일은 되돌리지 않았습니다.",
        ],
    )
