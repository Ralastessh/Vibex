from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from src.auth.device import RequireDevice
from src.projects.registry import UnknownProjectError
from src.tasks.models import Conversation, Task


router = APIRouter(
    prefix="/projects/{project_id}/conversations",
    tags=["conversations"],
    dependencies=[RequireDevice],
)


def _project(request: Request, project_id: str):
    try:
        return request.app.state.registry.resolve(project_id)
    except UnknownProjectError:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.") from None


class ConversationCreate(BaseModel):
    title: str = "새 대화"


class ConversationUpdate(BaseModel):
    title: str


class ConversationList(BaseModel):
    conversations: list[Conversation]


class ConversationDetail(BaseModel):
    conversation: Conversation
    tasks: list[Task]


@router.get("", response_model=ConversationList)
def list_conversations(project_id: str, request: Request) -> ConversationList:
    _project(request, project_id)
    return ConversationList(
        conversations=request.app.state.tasks.conversations(project_id)
    )


@router.post("", response_model=Conversation, status_code=201)
def create_conversation(
    project_id: str, body: ConversationCreate, request: Request
) -> Conversation:
    _project(request, project_id)
    return request.app.state.tasks.create_conversation(project_id, body.title)


@router.get("/{conversation_id}", response_model=ConversationDetail)
def get_conversation(
    project_id: str, conversation_id: str, request: Request
) -> ConversationDetail:
    _project(request, project_id)
    conversation = request.app.state.tasks.get_conversation(
        project_id, conversation_id
    )
    if conversation is None:
        raise HTTPException(status_code=404, detail="대화를 찾을 수 없습니다.")
    tasks = request.app.state.tasks.recent_for_conversation(
        project_id, conversation_id, limit=200
    )
    return ConversationDetail(
        conversation=conversation,
        tasks=list(reversed(tasks)),
    )


@router.patch("/{conversation_id}", response_model=Conversation)
def rename_conversation(
    project_id: str,
    conversation_id: str,
    body: ConversationUpdate,
    request: Request,
) -> Conversation:
    _project(request, project_id)
    try:
        return request.app.state.tasks.rename_conversation(
            project_id, conversation_id, body.title
        )
    except LookupError:
        raise HTTPException(status_code=404, detail="대화를 찾을 수 없습니다.") from None


@router.post("/{conversation_id}/archive", response_model=Conversation)
def archive_conversation(
    project_id: str, conversation_id: str, request: Request
) -> Conversation:
    _project(request, project_id)
    try:
        return request.app.state.tasks.archive_conversation(
            project_id, conversation_id
        )
    except LookupError:
        raise HTTPException(status_code=404, detail="대화를 찾을 수 없습니다.") from None
