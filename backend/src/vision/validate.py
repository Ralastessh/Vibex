from __future__ import annotations
import re
from backend.src.vision.schema import ProjectCommand

CONFIDENCE_FLOOR = 0.65

class UnsafeCommandError(ValueError):
    """검증 실패 시 실행하지 않음"""

# 불필요한 행위를 차단
_UNSAFE = (
    (re.compile(r"\brm\s+-[a-z]*[rf]", re.I), "파일 삭제 명령"),
    (re.compile(r"\bgit\s+(reset|clean|push|commit|rebase|checkout\s+-f)", re.I), "Git 명령"),
    (re.compile(r"\bbranch\s+-D\b", re.I), "브랜치 삭제"),
    (re.compile(r"\b(sudo|chmod|chown|curl|wget|ssh|scp|eval|exec)\b", re.I), "shell 명령"),
    (re.compile(r"\$\(|`|\|\||&&|;\s*\w+\s+-"), "shell 구문"),
    (re.compile(r"(^|[\s\"'])(/(Users|etc|var|usr|bin|opt|System)/|~/)"), "절대 경로"),
    (re.compile(r"\.\./"), "상위 경로 참조"),
    (re.compile(r"\brepo_?path\b", re.I), "repoPath 지정 시도"),
    (re.compile(r"이전\s*지시|무시하고|ignore\s+(all\s+)?previous", re.I), "지시 무시 유도"),
)

def _strings(value) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, dict):
        return [s for v in value.values() for s in _strings(v)] + [
            s for k in value for s in _strings(k)
        ]
    if isinstance(value, (list, tuple)):
        return [s for item in value for s in _strings(item)]
    return []

def scan_for_injection(command: ProjectCommand) -> None:
    for text in _strings(command.model_dump(by_alias=True, mode="json")):
        for pattern, label in _UNSAFE:
            if pattern.search(text):
                raise UnsafeCommandError(
                    f"허용되지 않는 내용이 포함되어 실행하지 않습니다({label}): {text[:80]}"
                )

def validate(command: ProjectCommand) -> None:
    if not command.changes:
        # 빈 changes 금지. 무엇을 하라는 것인지 모른 채 에이전트를 부르지 않음
        raise UnsafeCommandError("해석된 변경 사항이 없습니다. 다시 그리거나 설명을 추가해 주세요.")
    scan_for_injection(command)

def is_confident_enough(command: ProjectCommand) -> bool:
    return command.overall_confidence >= CONFIDENCE_FLOOR
