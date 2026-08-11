from __future__ import annotations
import json
import re
from pydantic import BaseModel, Field, ValidationError
from src.tasks.models import ChangedFile, Question, TestResult

FENCE = "bridge"

# 프롬프트 말미에 붙는 출력 규칙
OUTPUT_CONTRACT = f"""출력 규칙(반드시 지킬 것):
응답의 가장 마지막에 아래 형식의 JSON을 ```{FENCE} 코드펜스로 감싸 정확히 하나만 출력한다.
- 판단이 필요해 진행할 수 없으면 status를 needs_answer로 하고, 코드를 수정하지 말고
  questions를 채운다. 질문에는 iPad에서 탭으로 고를 수 있는 선택지를 반드시 넣는다.
  화면의 특정 요소에 대한 질문이면 overlay에 그 요소의 정규화 좌표(0~1)를 넣는다.
- 작업을 마쳤으면 status를 completed로 한다.
- 테스트를 실행했다면 그 결과를 tests에 기록한다. 실행하지 못했다면 status를
  skipped로 하고 이유를 summary에 적는다. 실행하지 않은 것을 passed로 적지 않는다.

```{FENCE}
{{
  "status": "completed" | "needs_answer",
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

_BLOCK = re.compile(rf"```{FENCE}\s*(.*?)```", re.S)
_BLOCK_START = re.compile(rf"(?:^|\n)```{FENCE}(?:\s|$)")


class AgentReport(BaseModel):
    status: str = "completed"
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
