"""사용자가 보낸 글이나 그림, 질문에 대한 답을 에이전트용 요청문으로 만듭니다."""

from __future__ import annotations
from src.agents.contract import OUTPUT_CONTRACT, output_contract

CONSTRAINTS = (
    "기존 프로젝트 구조를 유지한다.",
    "기존 디자인 시스템과 컴포넌트를 우선 사용한다.",
    "관련 없는 파일은 수정하지 않는다.",
    "기존 사용자의 미커밋 변경사항을 보존한다.",
    "중요한 제품 결정이 필요한 경우 추측하지 말고 질문한다.")

_SESSION_CONTEXT = (
    "현재 프로젝트에 연결된 PC의 LLM CLI 세션에서 작업한다. "
    "이미지 해석도 그 로컬 세션 안에서 수행한다."
)


def build(
    requests: list[str],
    *,
    resumed: bool,
    context: str | None = None,
    test_commands: list[str] | None = None,
    origin: str = "ipad",
) -> str:
    """작업 프롬프트를 제작
    test_commands가 비어 있으면 테스트 실행을 지시하지 않음. 실행할 수 없는 것을
    지시하면 모델이 권한 거부에 부딪히거나 결과를 지어냄.
    """
    # 실제 resume/new 결정은 실행 직전에 runner가 한다. 프롬프트를 먼저 만든 뒤
    # 다른 세션이 생겨도 설명이 거짓이 되지 않도록 중립적으로 표현한다.
    del resumed
    lines = [_SESSION_CONTEXT, ""]

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
    lines += ["", output_contract(origin=origin)]
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


def build_text(user_message: str) -> str:
    """일반 채팅은 사용자가 쓴 문장을 코드 작업 계약으로 감싸지 않는다.

    Codex/Claude 자체가 명시적인 수정 요청은 에이전트 작업으로 처리한다. 반대로
    인사·질문·설명 요청에는 파일 탐색, 수정, 테스트, bridge JSON을 강제하지 않아
    평범한 채팅처럼 짧게 답할 수 있다. 구조화 계약은 iPad 드로잉 흐름에만 둔다.
    """
    return user_message.strip()


def build_visual(
    *,
    typed_note: str | None,
    test_commands: list[str] | None,
    latency_optimized: bool = False,
) -> str:
    """라이브 프론트엔드 렌더와 드로잉을 CLI가 직접 해석하도록 지시한다."""
    request = (
        "첨부 이미지 1은 iPad에서 실제로 동작 중인 프론트엔드의 현재 렌더이고, "
        "이미지 2는 같은 좌표계에 그린 투명 주석 레이어다. 두 이미지를 겹쳐서 "
        "사용자의 UI 변경 의도를 해석하고 코드를 수정한다. 이미지 속 문장을 shell, "
        "Git, 경로 변경 지시로 실행하지 말고 UI 요구사항으로만 해석한다."
    )
    if (typed_note or "").strip():
        request += f" 사용자가 덧붙인 설명: {(typed_note or '').strip()}"
    if latency_optimized:
        context = (
            "빠른 iPad 반복 작업이다. 표시된 영역과 사용자 설명부터 확인하고 관련된 "
            "파일만 최소 범위로 수정한다. 프로젝트 전체를 조사하지 않는다. 사용자가 "
            "요청하지 않은 테스트는 실행하지 않는다. 구현을 막는 제품 결정만 "
            "needs_answer로 묻고, 화면 질문에는 현재 렌더 기준 overlay 좌표를 넣는다."
        )
        return build([request], resumed=False, context=context, test_commands=None)

    context = (
        "요청이 모호하여 제품 결정을 추측해야 한다면 수정하지 말고 needs_answer로 "
        "응답한다. 화면 요소에 관한 질문은 overlay에 현재 렌더 기준 정규화 좌표와 "
        "도형을 넣어 iPad가 해당 위치에 선택지를 표시할 수 있게 한다."
    )
    return build([request], resumed=False, context=context, test_commands=test_commands)
