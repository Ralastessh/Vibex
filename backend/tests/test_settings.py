from __future__ import annotations
import os
import pathlib
import pytest
from src.config.settings import ENV_FILES, REPO_ROOT, ROOT_MARKERS, Settings


def test_repo_root_actually_points_at_the_repository():
    for marker in ROOT_MARKERS:
        assert (REPO_ROOT / marker).is_file(), f"{marker} 가 없습니다: {REPO_ROOT}"
    for directory in ("src", "tests"):
        assert (REPO_ROOT / directory).is_dir(), f"{directory}/ 가 없습니다: {REPO_ROOT}"
    assert (REPO_ROOT.parent / "requirements.txt").is_file()
    for directory in ("ipad-app", "docs"):
        assert (REPO_ROOT.parent / directory).is_dir()


def test_repo_root_contains_this_test_file():
    """가장 직접적인 확인 — 지금 실행 중인 파일이 REPO_ROOT 안에 있어야 한다."""
    assert pathlib.Path(__file__).resolve().is_relative_to(REPO_ROOT)


def test_package_lives_under_repo_root():
    """설정 모듈 자신이 REPO_ROOT 아래에 있는지."""
    import src.config.settings as module

    assert pathlib.Path(module.__file__).resolve().is_relative_to(REPO_ROOT / "src")


def test_env_lookup_is_independent_of_cwd():
    """첫 번째 경로는 절대 경로여야 실행 위치와 무관해진다."""
    assert ENV_FILES[0] == REPO_ROOT / ".env"
    assert ENV_FILES[0].is_absolute()
    # 마지막은 현재 디렉터리 덮어쓰기용이므로 상대 경로가 맞다.
    assert not ENV_FILES[-1].is_absolute()


def test_settings_can_ignore_env_files_entirely():
    """테스트는 개발자의 로컬 .env를 읽으면 안 된다.

    실제로 .env에 BRIDGE_WORKSPACE_ROOT를 넣자 '작업 폴더 미설정' 테스트가 깨졌다.
    기기마다 결과가 달라지는 테스트는 신뢰할 수 없다.
    """
    settings = Settings(_env_file=None, device_token="t")
    assert settings.workspace_root is None
    assert settings.codex_binary == "codex"


def test_environment_variable_wins(monkeypatch):
    """§18 — 환경변수로 주입하는 경로가 살아 있어야 한다(.env 없이 운영하는 경우)."""
    monkeypatch.setenv("BRIDGE_DEVICE_TOKEN", "from-env")
    assert Settings(_env_file=None).device_token == "from-env"


def test_token_is_optional_for_tailscale_serve():
    settings = Settings(_env_file=None, device_token="  ")
    assert settings.device_token.strip() == ""


def test_tailscale_allowlist_is_normalized():
    settings = Settings(
        _env_file=None,
        tailscale_allowed_users=" User@Example.com, second@example.com ,",
    )
    assert settings.tailscale_user_allowlist == {
        "user@example.com",
        "second@example.com",
    }


def test_defaults_do_not_depend_on_cwd(tmp_path, monkeypatch):
    """다른 디렉터리에서 실행해도 기본 경로가 저장소 최상위를 가리켜야 한다."""
    monkeypatch.chdir(tmp_path)
    settings = Settings(_env_file=None, device_token="t")
    assert settings.projects_file == REPO_ROOT / "projects.local.json"
    assert settings.projects_file.is_absolute()


def test_env_file_is_read_from_repo_root(tmp_path, monkeypatch):
    """최상위에 둔 .env가 실행 위치와 무관하게 읽히는지."""
    env_file = tmp_path / ".env"
    env_file.write_text("BRIDGE_DEVICE_TOKEN=root-token\n", encoding="utf-8")
    monkeypatch.chdir(tmp_path)
    # 실제 REPO_ROOT를 건드릴 수 없으므로, 같은 규칙(절대 경로 지정)이 동작함을 본다.
    assert Settings(_env_file=env_file).device_token == "root-token"


def test_later_env_file_overrides_earlier(tmp_path):
    """계층 규칙: 뒤에 오는 파일이 앞의 값을 덮어쓴다."""
    wide = tmp_path / "wide.env"
    narrow = tmp_path / "narrow.env"
    wide.write_text("BRIDGE_DEVICE_TOKEN=wide\nBRIDGE_CODEX_BINARY=my-codex\n", encoding="utf-8")
    narrow.write_text("BRIDGE_DEVICE_TOKEN=narrow\n", encoding="utf-8")

    settings = Settings(_env_file=(wide, narrow))
    assert settings.device_token == "narrow"
    # 덮어쓰지 않은 값은 앞 파일에서 그대로 온다
    assert settings.codex_binary == "my-codex"


def test_env_file_is_not_committed():
    """§18.10 — 실제 .env가 저장소에 들어가면 키가 새어 나간다."""
    import subprocess

    tracked = subprocess.run(
        ["git", "ls-files", str(REPO_ROOT / ".env")],
        capture_output=True, text=True, cwd=REPO_ROOT,
    ).stdout.strip()
    assert tracked == "", f"저장소에 .env가 추적되고 있습니다: {tracked}"


def test_process_environment_is_untouched():
    """Settings 생성이 os.environ을 오염시키지 않는지 — 테스트 간 누수를 막는다."""
    before = dict(os.environ)
    Settings(_env_file=None, device_token="x")
    assert dict(os.environ) == before
