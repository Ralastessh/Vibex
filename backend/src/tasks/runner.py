from __future__ import annotations
import logging
from pathlib import Path
from src.agents.base import AgentAdapter
from src.agents.contract import without_block
from src.projects import git
from src.projects.registry import Project
from src.tasks.models import ChangedFile, TaskStatus
from src.tasks.store import TaskStore

logger = logging.getLogger("bridge.runner")

MAX_REPLY_CHARS = 20_000

def _reply(result) -> str | None:
    """에이전트가 사람에게 한 말. 저장할 게 없으면 None(= 기존 값 유지)."""
    text = without_block(result.raw_output)
    if not text:
        return None
    if len(text) <= MAX_REPLY_CHARS:
        return text
    return text[:MAX_REPLY_CHARS] + "\n…(이후 생략)"

# 그림 프롬포트 전달 이후 LLM의 답변 생성
async def run_task(
    *,
    task_id: str,
    project: Project,
    prompt: str,
    adapter: AgentAdapter,
    store: TaskStore,
    session_id: str | None = None,
    image_paths: list[Path] | None = None,
    asset_store=None) -> None:
    """기록된 세션 또는 같은 프로젝트의 기존 세션을 이어서 작업한다."""
    try:
        await _run(
            task_id=task_id, project=project, prompt=prompt, adapter=adapter,
            store=store, session_id=session_id, image_paths=image_paths
        )
    except Exception as exc:
        logger.exception("작업 %s 실행 중 예기치 못한 오류", task_id)
        current = store.get(task_id)
        if current is not None and current.status is TaskStatus.CANCELLED:
            return
        store.update(
            task_id,
            status=TaskStatus.FAILED,
            error=f"실행 중 오류가 발생했습니다: {exc}",
        )
    finally:
        if asset_store is not None and image_paths:
            asset_store.cleanup(image_paths)

async def _run(
    *,
    task_id: str,
    project: Project,
    prompt: str,
    adapter: AgentAdapter,
    store: TaskStore,
    session_id: str | None = None,
    image_paths: list[Path] | None = None,
) -> None:
    try:
        # 실행 전 상태를 기록
        before = git.snapshot(project.repo_path)
    except (FileNotFoundError, git.NotAGitRepositoryError) as exc:
        store.update(task_id, status=TaskStatus.FAILED, error=str(exc))
        return

    warnings: list[str] = []
    if before.has_uncommitted_changes:
        warnings.append(
            f"실행 전 미커밋 변경사항이 {len(before.entries)}건 있었습니다. "
            "보존 여부를 확인하세요."
        )

    if session_id is None:
        store.update(task_id, status=TaskStatus.RESOLVING_SESSION)
        session_id = await adapter.find_latest_session(project.repo_path)

    if session_id is not None:
        logger.info("작업 %s: 기록된 세션을 이어갑니다 — %s", task_id, session_id)
    else:
        logger.info("작업 %s: 이 프로젝트에 세션이 없어 새 세션을 시작합니다.", task_id)

    store.update(task_id, status=TaskStatus.RUNNING_AGENT, session_id=session_id or "")
    result = await adapter.resume_and_run(
        project.repo_path,
        session_id,
        prompt,
        test_commands=project.test_commands,
        image_paths=image_paths,
    )

    # CLI 프로세스가 끝나기 전에 사용자가 취소했으면 결과가 취소 상태를 덮지 않는다.
    current = store.get(task_id)
    if current is not None and current.status is TaskStatus.CANCELLED:
        return

    try:
        after = git.snapshot(project.repo_path)
    except Exception as exc:  # 저장소가 사라진 경우 등
        store.update(task_id, status=TaskStatus.FAILED, error=str(exc))
        return

    delta = git.diff(before, after)
    if delta.branch_changed:
        warnings.append(f"브랜치가 {before.branch} 에서 {after.branch} 로 바뀌었습니다.")

    report = result.report
    warnings += report.warnings if report else []

    if result.error and not result.ok:
        if delta.touched_anything:
            warnings.append(
                "작업은 실패했지만 파일이 변경되었습니다: "
                + ", ".join(delta.changed_paths)
            )
        store.update(
            task_id,
            status=TaskStatus.FAILED,
            error=result.error,
            summary=report.summary if report else None,
            agent_reply=_reply(result),
            changed_files=_changed_files(delta, report),
            test_results=report.tests if report else [],
            warnings=warnings,
            session_id=result.session_id or "",
        )
        return

    assert report is not None

    if report.needs_answer:
        store.update(
            task_id,
            status=TaskStatus.AWAITING_CONFIRMATION,
            summary=report.summary,
            agent_reply=_reply(result),
            questions=report.questions,
            changed_files=_changed_files(delta, report),
            warnings=warnings,
            session_id=result.session_id or "",
        )
        return

    store.update(
        task_id,
        status=TaskStatus.COMPLETED,
        summary=report.summary,
        agent_reply=_reply(result),
        changed_files=_changed_files(delta, report),
        test_results=report.tests,
        questions=[],
        warnings=warnings,
        session_id=result.session_id or "",
    )

# LLM이 어떤 파일을 수정했는지를 알려줌
def _changed_files(delta: git.GitDelta, report) -> list[ChangedFile]:
    summaries = {c.path: c.summary for c in (report.changed_files if report else [])}
    return [
        ChangedFile(path=path, summary=summaries.get(path, ""))
        for path in delta.changed_paths
    ]
