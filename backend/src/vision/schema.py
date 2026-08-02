from __future__ import annotations
from enum import Enum
from pydantic import BaseModel, Field

SCHEMA_VERSION = "1.0"

class TaskType(str, Enum):
    MODIFY_EXISTING_UI = "modify_existing_ui"
    CREATE_NEW_UI = "create_new_ui"
    MODIFY_FLOW = "modify_flow"

class Operation(str, Enum):
    MOVE = "move"        # 화살표로 위치 이동
    RESIZE = "resize"    # 카드 크기 변경
    STYLE = "style"      # 색상·모서리 등
    ADD = "add"          # 새 요소 추가
    REMOVE = "remove"    # 요소 제거
    CONNECT = "connect"  # 화면 간 연결
    TEXT = "text"        # 문구 변경


class Target(BaseModel):
    screen: str = ""

class Detail(BaseModel):
    name: str
    value: str

class Change(BaseModel):
    operation: Operation
    target: str
    description: str = ""
    details: list[Detail] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)

class ProjectCommand(BaseModel):
    schema_version: str = Field(default=SCHEMA_VERSION, alias="schemaVersion")
    task_type: TaskType = Field(alias="taskType")
    summary: str
    target: Target = Field(default_factory=Target)
    changes: list[Change] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    # 에이전트가 그림만으로 판단하지 않도록 하기 위함
    questions: list[str] = Field(default_factory=list)
    overall_confidence: float = Field(ge=0.0, le=1.0, alias="overallConfidence")

    model_config = {"populate_by_name": True, "serialize_by_alias": True}

    def to_requests(self) -> list[str]:
        requests = []
        for change in self.changes:
            line = change.description.strip() or f"{change.target}를 {change.operation.value}"
            if change.details:
                detail = ", ".join(f"{d.name}: {d.value}" for d in change.details)
                line = f"{line} ({detail})"
            requests.append(line)
        return requests

# OpenAI가 특정 형식의 JSON을 반환
def json_schema() -> dict:
    return {
        "type": "object",
        "additionalProperties": False,
        "required": [
            "schemaVersion", "taskType", "summary", "target",
            "changes", "constraints", "questions", "overallConfidence",
        ],
        "properties": {
            "schemaVersion": {"type": "string"},
            "taskType": {"type": "string", "enum": [t.value for t in TaskType]},
            "summary": {"type": "string"},
            "target": {
                "type": "object",
                "additionalProperties": False,
                "required": ["screen"],
                "properties": {"screen": {"type": "string"}},
            },
            "changes": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["operation", "target", "description", "details", "confidence"],
                    "properties": {
                        "operation": {"type": "string", "enum": [o.value for o in Operation]},
                        "target": {"type": "string"},
                        "description": {"type": "string"},
                        "details": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "additionalProperties": False,
                                "required": ["name", "value"],
                                "properties": {
                                    "name": {"type": "string"},
                                    "value": {"type": "string"},
                                },
                            },
                        },
                        "confidence": {"type": "number"},
                    },
                },
            },
            "constraints": {"type": "array", "items": {"type": "string"}},
            "questions": {"type": "array", "items": {"type": "string"}},
            "overallConfidence": {"type": "number"},
        },
    }
