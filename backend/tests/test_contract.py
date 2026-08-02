"""에이전트 출력 계약 (docs/claude-code-adapter.md §5, §6).

파싱이 조용히 실패하면 빈 결과가 iPad에 "완료"로 도착한다.
"""

from __future__ import annotations

import pytest

from src.agents.contract import OUTPUT_CONTRACT, ContractError, extract

COMPLETED = """작업을 마쳤습니다.

```bridge
{
  "status": "completed",
  "summary": "로그인 실패 시 비밀번호 찾기 링크를 추가했다.",
  "changedFiles": [{"path": "src/pages/Login.jsx", "summary": "링크 추가"}],
  "tests": [{"command": "npx vitest run", "status": "passed", "summary": "3 passed"}],
  "questions": [],
  "warnings": []
}
```"""


def test_extracts_completed_report():
    report = extract(COMPLETED)
    assert report.status == "completed"
    assert report.changed_files[0].path == "src/pages/Login.jsx"
    assert report.tests[0].status == "passed"
    assert not report.needs_answer


def test_extracts_questions():
    text = """진행 전에 확인이 필요합니다.

```bridge
{"status": "needs_answer", "summary": "제공업체 확인 필요",
 "changedFiles": [], "tests": [],
 "questions": [{"questionId": "q1", "text": "어떤 제공업체?",
                "options": [{"optionId": "a", "label": "Google"}]}],
 "warnings": []}
```"""
    report = extract(text)
    assert report.needs_answer
    assert report.questions[0].options[0].label == "Google"


def test_last_block_wins():
    """모델이 설명 중 예시로 블록을 적을 수 있다. 계약은 '마지막에 하나'다."""
    text = """예를 들면 이런 형식입니다.

```bridge
{"status": "completed", "summary": "예시"}
```

실제 결과입니다.

```bridge
{"status": "completed", "summary": "진짜"}
```"""
    assert extract(text).summary == "진짜"


def test_questions_alone_mean_answer_needed():
    """status를 completed로 적어도 질문이 있으면 답을 받아야 한다."""
    text = """```bridge
{"status": "completed", "summary": "s",
 "questions": [{"questionId": "q1", "text": "?", "options": []}]}
```"""
    assert extract(text).needs_answer


def test_missing_block_is_an_error_not_an_empty_result():
    """결과를 지어내지 않는다 — 빈 결과를 성공으로 보고하면 안 된다."""
    with pytest.raises(ContractError, match="찾지 못했습니다"):
        extract("작업을 마쳤습니다. 파일 3개를 수정했어요.")


def test_broken_json_is_an_error():
    with pytest.raises(ContractError, match="해석할 수 없습니다"):
        extract("```bridge\n{깨진 json\n```")


def test_prompt_and_parser_share_the_fence():
    """계약 문구와 파서가 어긋나면 파싱이 조용히 실패한다."""
    assert "```bridge" in OUTPUT_CONTRACT
