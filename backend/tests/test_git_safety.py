"""Git 안전 규칙 (CLAUDE.md §16, §23.17).

이 모듈이 틀리면 두 가지가 무너진다.
1. 사용자의 미커밋 변경사항이 파괴됐는지 알 수 없다.
2. 에이전트가 실제로 무엇을 바꿨는지 알 수 없다 — 자기 보고만 남는다.
"""

from __future__ import annotations

import subprocess

import pytest

from src.projects import git


def run(path, *args):
    subprocess.run(["git", *args], cwd=path, check=True, capture_output=True)


@pytest.fixture
def repo(tmp_path):
    path = tmp_path / "repo"
    (path / "src").mkdir(parents=True)
    (path / "src" / "app.js").write_text("original\n", encoding="utf-8")
    run(path, "init", "-q")
    run(path, "config", "user.email", "t@e.st")
    run(path, "config", "user.name", "t")
    run(path, "add", "-A")
    run(path, "commit", "-q", "-m", "init")
    return path


def test_clean_repo_snapshot(repo):
    snap = git.snapshot(repo)
    assert not snap.has_uncommitted_changes
    assert snap.branch in {"main", "master"}


def test_repo_with_no_commits_works(tmp_path):
    """방금 만든 프로젝트는 커밋이 하나도 없다.

    `git rev-parse HEAD`를 쓰면 이 경우 실패해서, iPad에서 새로 만든 프로젝트의
    첫 작업이 항상 깨진다. 실제로 그렇게 깨졌다.
    """
    fresh = tmp_path / "fresh"
    fresh.mkdir()
    run(fresh, "init", "-q")
    snap = git.snapshot(fresh)
    assert snap.branch
    assert not snap.has_uncommitted_changes


def test_untracked_file_in_empty_repo_is_detected(tmp_path):
    fresh = tmp_path / "fresh"
    fresh.mkdir()
    run(fresh, "init", "-q")
    before = git.snapshot(fresh)
    (fresh / "README.md").write_text("# hi\n", encoding="utf-8")
    assert "README.md" in git.diff(before, git.snapshot(fresh)).changed_paths


def test_rejects_non_git_directory(tmp_path):
    plain = tmp_path / "plain"
    plain.mkdir()
    with pytest.raises(git.NotAGitRepositoryError):
        git.snapshot(plain)


def test_rejects_missing_path(tmp_path):
    with pytest.raises(FileNotFoundError):
        git.snapshot(tmp_path / "nope")


def test_records_preexisting_changes(repo):
    """§16.5 — 사용자가 이미 고쳐 둔 것을 기록해야 구분할 수 있다."""
    (repo / "src" / "app.js").write_text("사용자 수정\n", encoding="utf-8")
    snap = git.snapshot(repo)
    assert snap.has_uncommitted_changes
    assert "src/app.js" in snap.dirty_paths


def test_detects_agent_modification(repo):
    before = git.snapshot(repo)
    (repo / "src" / "app.js").write_text("에이전트 수정\n", encoding="utf-8")
    delta = git.diff(before, git.snapshot(repo))
    assert delta.changed_paths == ("src/app.js",)
    assert delta.preexisting_paths == ()


def test_detects_new_file(repo):
    before = git.snapshot(repo)
    (repo / "src" / "new.js").write_text("새 파일\n", encoding="utf-8")
    assert "src/new.js" in git.diff(before, git.snapshot(repo)).changed_paths


def test_detects_deleted_file(repo):
    before = git.snapshot(repo)
    (repo / "src" / "app.js").unlink()
    assert "src/app.js" in git.diff(before, git.snapshot(repo)).changed_paths


def test_users_untouched_changes_are_not_credited_to_the_agent(repo):
    """사용자가 미리 고쳐 둔 파일을 에이전트가 건드리지 않았다면 변경 목록에 없어야 한다."""
    (repo / "src" / "app.js").write_text("사용자 수정\n", encoding="utf-8")
    before = git.snapshot(repo)

    (repo / "src" / "other.js").write_text("에이전트\n", encoding="utf-8")
    delta = git.diff(before, git.snapshot(repo))

    assert delta.changed_paths == ("src/other.js",)
    assert delta.preexisting_paths == ("src/app.js",)


def test_agent_editing_the_same_file_is_detected(repo):
    """사용자와 에이전트가 같은 파일을 건드린 경우 — 놓치면 안 된다."""
    (repo / "src" / "app.js").write_text("사용자\n", encoding="utf-8")
    before = git.snapshot(repo)
    run(repo, "add", "src/app.js")  # 에이전트가 스테이징하면 status 문자가 바뀐다
    delta = git.diff(before, git.snapshot(repo))
    assert "src/app.js" in delta.changed_paths


def test_branch_change_is_detected(repo):
    before = git.snapshot(repo)
    run(repo, "checkout", "-q", "-b", "feature")
    assert git.diff(before, git.snapshot(repo)).branch_changed


def test_paths_with_spaces(repo):
    before = git.snapshot(repo)
    (repo / "src" / "my file.js").write_text("x\n", encoding="utf-8")
    assert "src/my file.js" in git.diff(before, git.snapshot(repo)).changed_paths
