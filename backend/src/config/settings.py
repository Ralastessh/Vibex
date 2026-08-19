from __future__ import annotations
from functools import lru_cache
from pathlib import Path
import tempfile
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[2]
# 저장소 루트(backend/의 부모). 모든 기본 경로는 여기서 파생되므로 저장소를
# 어느 머신 어느 폴더에 두든 설정 없이 동작한다.
CHECKOUT_ROOT = REPO_ROOT.parent
ROOT_MARKERS = ("pytest.ini",)
ENV_FILES = (REPO_ROOT / ".env", Path(".env"))


def default_workspace_root() -> Path | None:
    """체크아웃 안의 기본 작업공간 경로.

    Settings 필드 기본값으로는 쓰지 않는다 — 그러면 테스트가 개발자 머신의
    실제 폴더를 집어 결과가 기기마다 달라진다(tests/test_settings.py 참고).
    scripts/setup.sh 가 이 값을 읽어 머신별 .env 를 생성한다.
    """
    candidate = CHECKOUT_ROOT / "test-projects"
    return candidate if candidate.is_dir() else None

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="BRIDGE_", env_file=ENV_FILES, extra="ignore")
    # 이전 앱 빌드 호환용. 새 연결은 Tailscale Serve의 사용자 신원을 쓴다.
    device_token: str = ""
    tailscale_allowed_users: str = ""
    projects_file: Path = REPO_ROOT / "projects.local.json"
    conversations_file: Path | None = None
    workspace_root: Path | None = None
    # 향후 다양한 모델 지원 예정
    claude_binary: str = "claude"
    codex_binary: str = "codex"
    agent_timeout_seconds: float = 1800.0
    max_budget_usd: float = 2.0
    max_image_bytes: int = 32 * 1024 * 1024
    # VIBEX가 선택 모델에 추가하는 공용 이전 문맥만 제한한다. 각 CLI 자체의
    # system/tool prompt와 네이티브 세션 compaction은 해당 공급자가 관리한다.
    shared_context_max_tokens: int = Field(default=32_768, ge=1_024)
    shared_context_recent_tokens: int = Field(default=12_288, ge=512)
    shared_context_summary_tokens: int = Field(default=4_096, ge=256)
    task_assets_root: Path = Path(tempfile.gettempdir()) / "vibex-task-assets"
    # 첫 Vite 실행은 dependency pre-bundle 때문에 느릴 수 있다.
    preview_start_timeout_seconds: float = 180.0
    preview_public_host: str = ""

    @property
    def max_upload_bytes(self) -> int:
        # 요청 전체 상한 — canvas + base + 폼 필드
        return self.max_image_bytes * 2 + 1024 * 1024

    @property
    def conversation_store_file(self) -> Path:
        """프로젝트 설정 옆에 공용 VIBEX 대화 기록을 둔다."""
        return self.conversations_file or self.projects_file.with_name(
            "conversations.local.json"
        )

    @property
    def tailscale_user_allowlist(self) -> set[str]:
        return {
            item.strip().lower()
            for item in self.tailscale_allowed_users.split(",")
            if item.strip()
        }

@lru_cache
def get_settings() -> Settings:
    return Settings()
