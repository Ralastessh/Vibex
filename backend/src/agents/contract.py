from __future__ import annotations
import json
import re
from pydantic import BaseModel, Field, ValidationError
from src.tasks.models import ChangedFile, Question, TestResult

FENCE = "bridge"


def output_contract(*, origin: str = "ipad") -> str:
    """클라이언트에 맞는 구조화 출력 계약을 만든다.

    iPad만 화면 위 선택지/도형으로 명확화 질문을 받는다. VS Code WebView는
    일반 Codex/Claude 대화처럼 에이전트가 ``reply``에서 직접 되묻고, 다음
    사용자 메시지를 평범한 후속 턴으로 받는다.
    """
    if origin == "vscode":
        clarification = """- 요청이 모호하면 일반 채팅처럼 reply에서 사용자에게 직접 되묻는다.
  이 경우에도 status는 completed로 하고 questions는 반드시 빈 배열로 둔다.
  iPad 전용 선택지, overlay, needs_answer 상태를 사용하지 않는다."""
    else:
        clarification = """- 판단이 필요해 진행할 수 없으면 status를 needs_answer로 하고, 코드를 수정하지 말고
  questions를 채운다. 질문에는 iPad에서 탭으로 고를 수 있는 선택지를 반드시 넣는다.
  화면의 특정 요소에 대한 질문이면 overlay에 그 요소의 정규화 좌표(0~1)를 넣는다."""

    return f"""출력 규칙(반드시 지킬 것):
응답의 가장 마지막에 아래 형식의 JSON을 ```{FENCE} 코드펜스로 감싸 정확히 하나만 출력한다.
- 사용자에게 보여 줄 최종 답변은 reply에 넣는다. bridge 코드펜스 밖에는 텍스트를
  출력하지 않는다. 사용자가 정확한 문구나 형식을 요구했다면 reply에서 그대로 지킨다.
{clarification}
- 작업을 마쳤으면 status를 completed로 한다.
- 테스트를 실행했다면 그 결과를 tests에 기록한다. 실행하지 못했다면 status를
  skipped로 하고 이유를 summary에 적는다. 실행하지 않은 것을 passed로 적지 않는다.

```{FENCE}
{{
  "status": "completed" | "needs_answer",
  "reply": "사용자에게 그대로 보여 줄 최종 답변. 질문에서 요구한 문구와 형식을 정확히 지킨다.",
  "summary": "무엇을 했는지 한 문장",
  "changedFiles": [{{"path": "상대경로", "summary": "무엇을 바꿨는지"}}],
  "tests": [{{"command": "실행한 명령", "status": "passed|failed|skipped", "summary": "결과"}}],
  "questions": [{{
    "questionId": "q1",
    "text": "질문",
    "overlay": {{"shape": "rectangle|ellipse|capsule", "x": 0.1, "y": 0.2, "width": 0.3, "height": 0.1, "label": "대상 요소"}},
    "options": [{{"optionId": "a", "label": "선택지"}}]
  }}],
  "warnings": ["주의할 점"]
}}
```"""


# 기존 iPad/테스트 호출부의 호환 상수. VS Code는 output_contract(origin="vscode")를 쓴다.
OUTPUT_CONTRACT = output_contract(origin="ipad")

_BLOCK = re.compile(rf"```{FENCE}\s*(.*?)```", re.S)
_BLOCK_START = re.compile(rf"(?:^|\n)```{FENCE}(?:\s|$)")


class AgentReport(BaseModel):
    status: str = "completed"
    reply: str = ""
    summary: str = ""
    changed_files: list[ChangedFile] = Field(default_factory=list, alias="changedFiles")
    tests: list[TestResult] = Field(default_factory=list)
    questions: list[Question] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)

    model_config = {"populate_by_name": True}

    @property
    def needs_answer(self) -> bool:
        return self.status == "needs_answer" or bool(self.questions)


class ContractError(ValueError):
    """에이전트가 계약을 지키지 않을 때 결과를 지어내지 않고 실패로 처리"""

def without_block(result_text: str) -> str:
    text = _BLOCK.sub("", result_text or "")
    # 스트리밍 도중에는 닫는 fence가 아직 오지 않을 수 있다. 내부 계약 JSON이
    # 잠깐 사용자 화면에 나타났다 사라지지 않도록 시작 fence부터 감춘다.
    start = _BLOCK_START.search(text)
    if start is not None:
        text = text[: start.start()]
    return text.strip()


def extract(result_text: str) -> AgentReport:
    blocks = _BLOCK.findall(result_text or "")
    if not blocks:
        raise ContractError("에이전트 응답에서 bridge 결과 블록을 찾지 못했습니다.")
    try:
        return AgentReport.model_validate(json.loads(blocks[-1]))
    except (json.JSONDecodeError, ValidationError) as exc:
        raise ContractError(f"결과 블록을 해석할 수 없습니다: {exc}") from exc
