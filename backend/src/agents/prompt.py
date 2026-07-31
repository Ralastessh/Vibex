from __future__ import annotations
from backend.src.agents.contract import OUTPUT_CONTRACT

#: §10의 제약 목록. 순서와 표현을 명세에 맞춘다.
CONSTRAINTS = (
    "기존 프로젝트 구조를 유지한다.",
    "기존 디자인 시스템과 컴포넌트를 우선 사용한다.",
    "관련 없는 파일은 수정하지 않는다.",
    "기존 사용자의 미커밋 변경사항을 보존한다.",
    "중요한 제품 결정이 필요한 경우 추측하지 말고 질문한다.")

_RESUMED = "현재 프로젝트의 기존 Claude Code 세션을 이어서 작업한다."
_FRESH = "현재 프로젝트에서 새로 작업을 시작한다."


def build(
    requests: list[str],
    *,
    resumed: bool,
    context: str | None = None,
    test_commands: list[str] | None = None,
) -> str:
    """작업 프롬프트를 제작
    test_commands가 비어 있으면 테스트 실행을 지시하지 않음. 실행할 수 없는 것을
    지시하면 모델이 권한 거부에 부딪히거나 결과를 지어냄.
    """
    lines = [_RESUMED if resumed else _FRESH, ""]

    if context:
        lines += [context.strip(), ""]

    lines.append("요청:")
    lines += [f"{i}. {r.strip()}" for i, r in enumerate(requests, start=1)]
    lines.append("")

    constraints = list(CONSTRAINTS)
    if test_commands:
        constraints.insert(
            4, f"관련 테스트를 실행한다. 허용된 명령: {', '.join(test_commands)}"
        )
    else:
        constraints.insert(4, "테스트 실행이 허용되지 않았다. 테스트를 실행하지 않는다.")

    lines.append("제약:")
    lines += [f"- {c}" for c in constraints]
    lines += ["", OUTPUT_CONTRACT]
    return "\n".join(lines)


def build_answer(question_text: str, answer_label: str) -> str:
    """§14 — iPad에서 고른 답을 세션에 전달한다."""
    return "\n".join(
        [
            "이전 질문에 대한 사용자의 답이다.",
            "",
            f"질문: {question_text}",
            f"답: {answer_label}",
            "",
            "이 답을 반영해 작업을 계속한다.",
            "",
            OUTPUT_CONTRACT,
        ]
    )
