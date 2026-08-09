from __future__ import annotations
from functools import lru_cache
from pathlib import Path
import tempfile
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[2]
ROOT_MARKERS = ("pytest.ini",)
ENV_FILES = (REPO_ROOT / ".env", Path(".env"))

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="BRIDGE_", env_file=ENV_FILES, extra="ignore")
    # 기기 토큰
    device_token: str = ""
    projects_file: Path = REPO_ROOT / "projects.local.json"
    workspace_root: Path | None = None
    # 향후 다양한 모델 지원 예정
    claude_binary: str = "claude"
    codex_binary: str = "codex"
    agent_timeout_seconds: float = 1800.0
    max_budget_usd: float = 2.0
    max_image_bytes: int = 32 * 1024 * 1024
    task_assets_root: Path = Path(tempfile.gettempdir()) / "vibex-task-assets"
    preview_start_timeout_seconds: float = 20.0
    preview_public_host: str = ""

    @property
    def max_upload_bytes(self) -> int:
        # 요청 전체 상한 — canvas + base + 폼 필드
        return self.max_image_bytes * 2 + 1024 * 1024

    def require_device_token(self) -> str:
        if not self.device_token.strip():
            raise RuntimeError(
                "BRIDGE_DEVICE_TOKEN 이 설정되지 않았습니다. "
                "인증 없이 실행하지 않습니다 (CLAUDE.md §18)."
            )
        return self.device_token.strip()

@lru_cache
def get_settings() -> Settings:
    return Settings()
