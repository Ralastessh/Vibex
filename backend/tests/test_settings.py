"""설정 로딩 (CLAUDE.md §18).

여기서 지키는 것은 하나다 — **어디서 실행하든 같은 설정이 읽힌다.**

pydantic-settings는 상대 경로 env_file을 현재 작업 디렉터리 기준으로 푼다.
그대로 두면 저장소 최상위에서 실행할 때와 bridge/ 안에서 실행할 때 결과가
달라지고, 토큰을 넣어 뒀는데 "설정되지 않았습니다"로 죽는다.
"""

from __future__ import annotations

import os
import pathlib

import pytest

from src.config.settings import ENV_FILES, REPO_ROOT, ROOT_MARKERS, Settings


def test_repo_root_actually_points_at_the_repository():
    """`parents[N]` 계산이 어긋나면 조용히 저장소 밖을 가리킨다.

    실제로 bridge/ 폴더를 없앨 때 한 칸씩 밀려 REPO_ROOT가 상위 디렉터리를
    가리켰는데, **테스트 172개가 전부 통과했다.** 그때의 검증이
    `BRIDGE_DIR.parent == REPO_ROOT` 같은 항상 참인 식이었기 때문이다.

    그래서 위치가 아니라 **내용**으로 확인한다. 최상위에만 있는 파일이 거기
    있어야 하고, 하위 디렉터리도 제자리에 있어야 한다.
    """
    for marker in ROOT_MARKERS:
        assert (REPO_ROOT / marker).is_file(), f"최상위에 {marker} 가 없습니다: {REPO_ROOT}"
    for directory in ("src", "tests", "ipad-app", "docs", "scripts"):
        assert (REPO_ROOT / directory).is_dir(), f"{directory}/ 가 없습니다: {REPO_ROOT}"


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
    assert settings.openai_api_key == ""


def test_environment_variable_wins(monkeypatch):
    """§18 — 환경변수로 주입하는 경로가 살아 있어야 한다(.env 없이 운영하는 경우)."""
    monkeypatch.setenv("BRIDGE_DEVICE_TOKEN", "from-env")
    assert Settings(_env_file=None).device_token == "from-env"


def test_missing_token_is_refused():
    """§18.14 — 무인증 실행을 코드가 막는다."""
    with pytest.raises(RuntimeError, match="BRIDGE_DEVICE_TOKEN"):
        Settings(_env_file=None, device_token="  ").require_device_token()


def test_token_is_trimmed():
    """복사·붙여넣기로 들어온 공백 때문에 인증이 실패하면 원인을 찾기 어렵다."""
    assert Settings(_env_file=None, device_token=" abc \n").require_device_token() == "abc"


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
    wide.write_text("BRIDGE_DEVICE_TOKEN=wide\nBRIDGE_VISION_MODEL=a\n", encoding="utf-8")
    narrow.write_text("BRIDGE_DEVICE_TOKEN=narrow\n", encoding="utf-8")

    settings = Settings(_env_file=(wide, narrow))
    assert settings.device_token == "narrow"
    # 덮어쓰지 않은 값은 앞 파일에서 그대로 온다
    assert settings.vision_model == "a"


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
