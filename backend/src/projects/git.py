from __future__ import annotations
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

class NotAGitRepositoryError(RuntimeError):
    pass

def _git(repo_path: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=repo_path,
        capture_output=True,
        text=True,
        timeout=30,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} 실패: {result.stderr.strip()}")
    return result.stdout

# Git을 통해 LLM이 새롭게 작업한 수정사항이 무엇인지 비교 및 추적 가능
@dataclass(frozen=True)
class GitSnapshot:
    branch: str
    #: `git status --porcelain` 한 줄씩. "XY path" 형태.
    entries: tuple[str, ...] = field(default_factory=tuple)

    @property
    def dirty_paths(self) -> frozenset[str]:
        return frozenset(_path_of(e) for e in self.entries)

    @property
    def has_uncommitted_changes(self) -> bool:
        return bool(self.entries)

def _path_of(entry: str) -> str:
    """`XY path` 또는 `XY old -> new` 에서 경로를 뽑는다."""
    body = entry[3:] if len(entry) > 3 else entry
    if " -> " in body:
        body = body.split(" -> ", 1)[1]
    return body.strip().strip('"')

def snapshot(repo_path: Path) -> GitSnapshot:
    # branch와 커밋되지 않은 부분을 확인
    if not repo_path.is_dir():
        raise FileNotFoundError(f"저장소 경로가 없습니다: {repo_path}")
    if not (repo_path / ".git").exists():
        raise NotAGitRepositoryError(f"Git 저장소가 아닙니다: {repo_path}")

    branch = _git(repo_path, "branch", "--show-current").strip()
    status = _git(repo_path, "status", "--porcelain")
    entries = tuple(line for line in status.splitlines() if line.strip())
    return GitSnapshot(branch=branch, entries=entries)

# 에이전트가 새롭게 수정한 사항
@dataclass(frozen=True)
class GitDelta:
    changed_paths: tuple[str, ...]
    preexisting_paths: tuple[str, ...]
    branch_changed: bool

    @property
    def touched_anything(self) -> bool:
        return bool(self.changed_paths)

# 전후 변경사항
def diff(before: GitSnapshot, after: GitSnapshot) -> GitDelta:
    before_entries = set(before.entries)
    changed = {_path_of(e) for e in after.entries if e not in before_entries}
    after_entries = set(after.entries)
    changed |= {_path_of(e) for e in before.entries if e not in after_entries}

    return GitDelta(
        changed_paths=tuple(sorted(changed)),
        preexisting_paths=tuple(sorted(before.dirty_paths)),
        branch_changed=before.branch != after.branch,
    )
