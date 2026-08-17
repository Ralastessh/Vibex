from __future__ import annotations
import asyncio
import inspect
import logging
from pathlib import Path
from src.agents.base import AgentAdapter, AgentProgress
from src.agents.contract import without_block
from src.projects import git
from src.projects.registry import Project
from src.tasks.models import ApprovalMode, ChangedFile, TaskStatus, ThreadMode
from src.tasks.store import TaskStore

logger = logging.getLogger("bridge.runner")

def _reply(result) -> str | None:
    """구조화 보고서의 사용자 답변을 우선하고 내부 bridge 블록은 숨긴다."""
    report_reply = getattr(result.report, "reply", "") if result.report else ""
    if report_reply:
        return report_reply
    text = without_block(result.raw_output)
    return text or None


def _is_natural_reply_without_contract(result) -> bool:
    """정상 자연어 답변에서 마지막 bridge 블록만 빠진 경우인지 확인한다."""
    return bool(
        result.report is None
        and _reply(result)
        and result.error
        and "bridge 결과 블록을 찾지 못했습니다" in result.error
    )


def _thread_title(user_message: str, *, limit: int = 56) -> str:
    """VIBEX 내부 프롬프트 대신 사용자가 쓴 문장으로 새 대화 이름을 만든다."""
    return " ".join(user_message.split())[:limit].rstrip()


async def _name_new_thread(
    *,
    task_id: str,
    project: Project,
    adapter: AgentAdapter,
    store: TaskStore,
    thread_id: str | None,
    thread_mode: ThreadMode,
) -> None:
    if thread_mode != "new" or not thread_id:
        return
    task = store.get(task_id)
    title = _thread_title(task.user_message if task is not None else "")
    setter = getattr(adapter, "set_thread_name", None)
    if not title or not callable(setter):
        return
    try:
        await setter(project.repo_path, thread_id, title)
    except Exception as exc:
        # 이름 지정 실패가 이미 끝난 에이전트 작업을 실패로 바꾸지는 않는다.
        logger.warning("새 Codex 대화 %s의 이름을 지정하지 못했습니다: %s", thread_id, exc)


def _record_cancelled_changes(
    *,
    task_id: str,
    project: Project,
    before: git.GitSnapshot,
    warnings: list[str],
    store: TaskStore,
    uncommitted_warning: str | None = None,
) -> None:
    """취소 시점의 working tree를 남겨 리뷰와 명시적 undo를 가능하게 한다."""
    current = store.get(task_id)
    if current is None:
        return

    cancelled_warnings = [
        *warnings,
        "사용자가 취소했습니다. 이미 변경된 파일은 되돌리지 않았습니다.",
    ]
    try:
        after = git.snapshot(project.repo_path)
        delta = git.diff(before, after)
    except Exception as exc:
        cancelled_warnings.append(f"취소 후 파일 변경을 확인하지 못했습니다: {exc}")
        store.update(
            task_id,
            status=TaskStatus.CANCELLED,
            warnings=cancelled_warnings,
        )
        return

    if delta.branch_changed:
        cancelled_warnings.append(
            f"브랜치가 {before.branch} 에서 {after.branch} 로 바뀌었습니다."
        )
    if delta.touched_anything:
        if uncommitted_warning:
            cancelled_warnings.insert(0, uncommitted_warning)
        cancelled_warnings.append(
            "취소되기 전에 파일 변경이 발생했습니다: "
            + ", ".join(delta.changed_paths)
        )
    store.update(
        task_id,
        status=TaskStatus.CANCELLED,
        changed_files=_changed_files(delta, None),
        warnings=cancelled_warnings,
        review_patch=delta.patch,
        review_before_tree=before.tree,
        review_after_tree=after.tree,
    )

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
    model: str | None = None,
    effort: str | None = None,
    speed_mode: str | None = None,
    approval_mode: ApprovalMode = "default",
    thread_mode: ThreadMode = "auto",
) -> None:
    """기록된 세션 또는 같은 프로젝트의 기존 세션을 이어서 작업한다."""
    try:
        await _run(
            task_id=task_id,
            project=project,
            prompt=prompt,
            adapter=adapter,
            store=store,
            session_id=session_id,
            image_paths=image_paths,
            model=model,
            effort=effort,
            speed_mode=speed_mode,
            approval_mode=approval_mode,
            thread_mode=thread_mode,
        )
    except asyncio.CancelledError:
        current = store.get(task_id)
        if current is not None and current.status is not TaskStatus.CANCELLED:
            store.update(
                task_id,
                status=TaskStatus.CANCELLED,
                warnings=[
                    *current.warnings,
                    "사용자가 취소했습니다. 이미 변경된 파일은 되돌리지 않았습니다.",
                ],
            )
        raise
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

async def _run(
    *,
    task_id: str,
    project: Project,
    prompt: str,
    adapter: AgentAdapter,
    store: TaskStore,
    session_id: str | None = None,
    image_paths: list[Path] | None = None,
    model: str | None = None,
    effort: str | None = None,
    speed_mode: str | None = None,
    approval_mode: ApprovalMode = "default",
    thread_mode: ThreadMode = "auto",
) -> None:
    try:
        # 실행 전 상태를 기록
        before = git.snapshot(project.repo_path)
    except (FileNotFoundError, git.NotAGitRepositoryError) as exc:
        store.update(task_id, status=TaskStatus.FAILED, error=str(exc))
        return

    warnings: list[str] = []
    # 미커밋 변경사항 경고는 이 작업이 실제로 파일을 건드렸을 때만 의미가 있다.
    # 인사말 같은 순수 대화 턴마다 경고를 붙이면 소음만 된다. delta 계산 후 판단.
    uncommitted_warning = (
        f"실행 전 미커밋 변경사항이 {len(before.entries)}건 있었습니다. "
        "보존 여부를 확인하세요."
        if before.has_uncommitted_changes
        else None
    )

    try:
        if thread_mode == "resume" and session_id is None:
            store.update(
                task_id,
                status=TaskStatus.FAILED,
                error="재개할 Codex threadId가 없습니다.",
            )
            return
        if thread_mode == "new":
            # Explicit new means exactly that. Never let the legacy latest-session
            # lookup silently turn the user's new-chat action into a resume.
            session_id = None
        elif thread_mode == "auto" and session_id is None:
            store.update(task_id, status=TaskStatus.RESOLVING_SESSION)
            session_id = await adapter.find_latest_session(project.repo_path)

        if session_id is not None:
            logger.info("작업 %s: 기록된 세션을 이어갑니다 — %s", task_id, session_id)
        else:
            logger.info("작업 %s: 이 프로젝트에 세션이 없어 새 세션을 시작합니다.", task_id)

        store.update(
            task_id,
            status=TaskStatus.RUNNING_AGENT,
            session_id=session_id or "",
            thread_id=session_id if session_id else None,
        )

        def on_progress(progress: AgentProgress) -> None:
            current = store.get(task_id)
            if current is None or current.status is TaskStatus.CANCELLED:
                return
            visible_reply = without_block(progress.agent_reply)
            store.update(
                task_id,
                agent_reply=visible_reply or None,
                activity_items=progress.activity_items,
                usage=progress.usage,
                thread_id=progress.thread_id,
                turn_id=progress.turn_id,
            )

        run_options = {
            "test_commands": project.test_commands,
            "image_paths": image_paths,
            "model": model,
            "effort": effort,
            "speed_mode": speed_mode,
            "on_progress": on_progress,
        }
        # 외부/테스트 어댑터의 기존 계약은 깨지 않는다. 새 어댑터만 실제
        # approval_mode를 받아 각 CLI 정책으로 변환한다.
        if "approval_mode" in inspect.signature(adapter.resume_and_run).parameters:
            run_options["approval_mode"] = approval_mode
        result = await adapter.resume_and_run(
            project.repo_path,
            session_id,
            prompt,
            **run_options,
        )
        await _name_new_thread(
            task_id=task_id,
            project=project,
            adapter=adapter,
            store=store,
            thread_id=result.thread_id or result.session_id,
            thread_mode=thread_mode,
        )
    except asyncio.CancelledError:
        _record_cancelled_changes(
            task_id=task_id,
            project=project,
            before=before,
            warnings=warnings,
            store=store,
            uncommitted_warning=uncommitted_warning,
        )
        raise

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
    if uncommitted_warning and delta.touched_anything:
        warnings.insert(0, uncommitted_warning)
    if delta.branch_changed:
        warnings.append(f"브랜치가 {before.branch} 에서 {after.branch} 로 바뀌었습니다.")

    report = result.report
    warnings += report.warnings if report else []

    if _is_natural_reply_without_contract(result):
        store.update(
            task_id,
            status=TaskStatus.COMPLETED,
            agent_reply=_reply(result),
            changed_files=_changed_files(delta, None),
            test_results=[],
            activity_items=result.activity_items or None,
            usage=result.usage,
            agent_model=result.resolved_model,
            questions=[],
            warnings=warnings,
            session_id=result.session_id or "",
            thread_id=result.thread_id,
            turn_id=result.turn_id,
            review_patch=delta.patch,
            review_before_tree=before.tree,
            review_after_tree=after.tree,
        )
        return

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
            activity_items=result.activity_items or None,
            usage=result.usage,
            agent_model=result.resolved_model,
            warnings=warnings,
            session_id=result.session_id or "",
            thread_id=result.thread_id,
            turn_id=result.turn_id,
            review_patch=delta.patch,
            review_before_tree=before.tree,
            review_after_tree=after.tree,
        )
        return

    assert report is not None

    if report.needs_answer and current is not None and current.origin == "vscode":
        # 구버전 세션이나 모델이 iPad 계약을 답습하더라도 VS Code를 선택지
        # 승인 흐름에 가두지 않는다. 질문은 평범한 assistant 답변으로 보여 주고
        # 다음 입력을 새 사용자 턴으로 받을 수 있게 작업을 완료한다.
        follow_up = _reply(result) or "\n\n".join(
            question.text for question in report.questions if question.text
        )
        store.update(
            task_id,
            status=TaskStatus.COMPLETED,
            summary=report.summary,
            agent_reply=follow_up,
            questions=[],
            changed_files=_changed_files(delta, report),
            test_results=report.tests,
            activity_items=result.activity_items or None,
            usage=result.usage,
            agent_model=result.resolved_model,
            warnings=warnings,
            session_id=result.session_id or "",
            thread_id=result.thread_id,
            turn_id=result.turn_id,
            review_patch=delta.patch,
            review_before_tree=before.tree,
            review_after_tree=after.tree,
        )
        return

    if report.needs_answer:
        store.update(
            task_id,
            status=TaskStatus.AWAITING_CONFIRMATION,
            summary=report.summary,
            agent_reply=_reply(result),
            questions=report.questions,
            changed_files=_changed_files(delta, report),
            activity_items=result.activity_items or None,
            usage=result.usage,
            agent_model=result.resolved_model,
            warnings=warnings,
            session_id=result.session_id or "",
            thread_id=result.thread_id,
            turn_id=result.turn_id,
            review_patch=delta.patch,
            review_before_tree=before.tree,
            review_after_tree=after.tree,
        )
        return

    store.update(
        task_id,
        status=TaskStatus.COMPLETED,
        summary=report.summary,
        agent_reply=_reply(result),
        changed_files=_changed_files(delta, report),
        test_results=report.tests,
        activity_items=result.activity_items or None,
        usage=result.usage,
        agent_model=result.resolved_model,
        questions=[],
        warnings=warnings,
        session_id=result.session_id or "",
        thread_id=result.thread_id,
        turn_id=result.turn_id,
        review_patch=delta.patch,
        review_before_tree=before.tree,
        review_after_tree=after.tree,
    )

# LLM이 어떤 파일을 수정했는지를 알려줌
def _changed_files(delta: git.GitDelta, report) -> list[ChangedFile]:
    summaries = {c.path: c.summary for c in (report.changed_files if report else [])}
    stats = {path: (additions, deletions) for path, additions, deletions in delta.stats}
    return [
        ChangedFile(
            path=path,
            summary=summaries.get(path, ""),
            additions=stats.get(path, (0, 0))[0],
            deletions=stats.get(path, (0, 0))[1],
        )
        for path in delta.changed_paths
    ]
