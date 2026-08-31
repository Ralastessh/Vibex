"""LLM이 작업하기 전후의 Git 상태를 비교
수정 파일 이름만 보지 않고 커밋, 스테이징 영역, 실제 파일 내용을 같이 기록해 비교"""
from __future__ import annotations
import os
import subprocess
import tempfile
from dataclasses import dataclass, field
from pathlib import Path, PurePosixPath

class NotAGitRepositoryError(RuntimeError):
    pass

def _git(
    repo_path: Path,
    *args: str,
    env: dict[str, str] | None = None,
    input_text: str | None = None,
) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=repo_path,
        capture_output=True,
        text=True,
        timeout=30,
        env=env,
        input=input_text,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} 실패: {result.stderr.strip()}")
    return result.stdout

# Git을 통해 LLM이 새롭게 작업한 수정사항이 무엇인지 비교 및 추적 가능
@dataclass(frozen=True)
class GitSnapshot:
    repo_path: Path
    branch: str
    tree: str
    entries: tuple[str, ...] = field(default_factory=tuple)

    @property
    def dirty_paths(self) -> frozenset[str]:
        return frozenset(_path_of(e) for e in self.entries)

    @property
    def has_uncommitted_changes(self) -> bool:
        return bool(self.entries)

def _path_of(entry: str) -> str:
    """XY path 또는 XY old -> new에서 경로 추출"""
    body = entry[3:] if len(entry) > 3 else entry
    if " -> " in body:
        body = body.split(" -> ", 1)[1]
    return body.strip().strip('"')

def snapshot(repo_path: Path) -> GitSnapshot:
    """현재 커밋과 스테이징 영역, 실제 파일 상태를 한 번에 기록, 아직 첫 커밋을 만들지 않은 저장소도 빈 저장소로 보고 처리"""
    # branch와 커밋되지 않은 부분을 확인
    if not repo_path.is_dir():
        raise FileNotFoundError(f"저장소 경로가 없습니다: {repo_path}")
    if not (repo_path / ".git").exists():
        raise NotAGitRepositoryError(f"Git 저장소가 아닙니다: {repo_path}")

    branch = _git(repo_path, "branch", "--show-current").strip()
    status = _git(repo_path, "status", "--porcelain")
    entries = tuple(line for line in status.splitlines() if line.strip())
    return GitSnapshot(
        repo_path=repo_path.resolve(),
        branch=branch,
        tree=_working_tree(repo_path),
        entries=entries,
    )

def _working_tree(repo_path: Path) -> str:
    """현재 작업 폴더 전체를 Git tree로 생성"""
    with tempfile.TemporaryDirectory(prefix="vibex-git-index-") as directory:
        index = Path(directory) / "index"
        env = {**os.environ, "GIT_INDEX_FILE": str(index)}
        head = subprocess.run(
            ["git", "rev-parse", "--verify", "HEAD"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=30,
        )
        if head.returncode == 0:
            _git(repo_path, "read-tree", "HEAD", env=env)
        else:
            _git(repo_path, "read-tree", "--empty", env=env)
        _git(repo_path, "add", "-A", env=env)
        return _git(repo_path, "write-tree", env=env).strip()

# 에이전트가 새롭게 수정한 사항
@dataclass(frozen=True)
class GitDelta:
    changed_paths: tuple[str, ...]
    preexisting_paths: tuple[str, ...]
    branch_changed: bool
    patch: str = ""
    stats: tuple[tuple[str, int, int], ...] = field(default_factory=tuple)

    @property
    def touched_anything(self) -> bool:
        return bool(self.changed_paths)

# 전후 변경사항
def diff(before: GitSnapshot, after: GitSnapshot) -> GitDelta:
    """두 기록을 비교해서 LLM 작업 중에 생긴 변경만 탐색
    작업 전부터 수정 중이던 파일은 사용자가 iPad에서 수정한 사항이 아님 -> 내용이 더 바뀐 경우(사용자가 추가 개입)에만 결과에 포함한다. 
    새 파일과 삭제한 파일, 브랜치 변경을 확인하고 나중에 되돌릴 때 쓸 패치도 함께 추가"""
    if before.repo_path != after.repo_path:
        raise ValueError("서로 다른 저장소의 스냅샷은 비교할 수 없습니다.")

    raw_paths = _git(
        before.repo_path,
        "diff",
        "--name-only",
        "-z",
        before.tree,
        after.tree,
        "--",
    )
    changed_set = {path for path in raw_paths.split("\0") if path}
    before_entries = set(before.entries)
    after_entries = set(after.entries)
    changed_set |= {_path_of(entry) for entry in before_entries ^ after_entries}
    changed = tuple(sorted(changed_set))
    stats: list[tuple[str, int, int]] = []
    for path in changed:
        line = _git(
            before.repo_path,
            "diff",
            "--numstat",
            before.tree,
            after.tree,
            "--",
            path,
        ).splitlines()
        additions = deletions = 0
        if line:
            columns = line[0].split("\t", 2)
            if len(columns) >= 2:
                additions = int(columns[0]) if columns[0].isdigit() else 0
                deletions = int(columns[1]) if columns[1].isdigit() else 0
        stats.append((path, additions, deletions))

    patch = _git(
        before.repo_path,
        "diff",
        "--binary",
        "--no-ext-diff",
        before.tree,
        after.tree,
        "--",
    )

    return GitDelta(
        changed_paths=changed,
        preexisting_paths=tuple(sorted(before.dirty_paths)),
        branch_changed=before.branch != after.branch,
        patch=patch,
        stats=tuple(stats),
    )


def reverse_patch(repo_path: Path, patch: str) -> None:
    """후속 변경과 충돌하면 아무것도 건드리지 않고 거부"""
    if not patch.strip():
        raise RuntimeError("되돌릴 파일 변경이 없습니다.")
    _git(repo_path, "apply", "--reverse", "--check", input_text=patch)
    _git(repo_path, "apply", "--reverse", input_text=patch)

def read_tree_file(repo_path: Path, tree: str, path: str) -> bytes | None:
    """스냅샷 트리의 파일 내용을 읽어오기"""
    relative = PurePosixPath(path)
    if not path or relative.is_absolute() or ".." in relative.parts:
        raise ValueError("리뷰 파일 경로가 올바르지 않습니다.")
    if not tree or any(character.isspace() for character in tree):
        raise ValueError("Git tree 식별자가 올바르지 않습니다.")

    spec = f"{tree}:{relative.as_posix()}"
    exists = subprocess.run(
        ["git", "cat-file", "-e", spec],
        cwd=repo_path,
        capture_output=True,
        timeout=30,
    )
    if exists.returncode != 0:
        return None

    result = subprocess.run(
        ["git", "show", spec],
        cwd=repo_path,
        capture_output=True,
        timeout=30,
    )
    if result.returncode != 0:
        detail = result.stderr.decode("utf-8", "replace").strip()
        raise RuntimeError(f"Git 스냅샷 파일을 읽지 못했습니다: {detail}")
    return result.stdout
