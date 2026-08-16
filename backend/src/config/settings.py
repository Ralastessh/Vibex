from __future__ import annotations
from functools import lru_cache
from pathlib import Path
import tempfile
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[2]
ROOT_MARKERS = ("pytest.ini",)
ENV_FILES = (REPO_ROOT / ".env", Path(".env"))

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
