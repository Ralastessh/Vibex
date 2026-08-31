"""환경 변수와 env 파일에서 백엔드 설정 불러오기"""
from __future__ import annotations
from functools import lru_cache
from pathlib import Path
import tempfile
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# 기본값은 저장소(Vibex) 최상위 경로
REPO_ROOT = Path(__file__).resolve().parents[2]
CHECKOUT_ROOT = REPO_ROOT.parent
ROOT_MARKERS = ("pytest.ini",)
ENV_FILES = (REPO_ROOT / ".env", Path(".env"))

def default_workspace_root() -> Path | None:
    """체크아웃 안의 기본 작업공간 경로
    PC 별 폴더를 집어 결과가 기기마다 달라질 수 있기 때문에, scripts/setup.sh로 이 값을 읽어 머신별 .env 를 생성하도록 변경"""
    candidate = CHECKOUT_ROOT / "test-projects"
    return candidate if candidate.is_dir() else None

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="BRIDGE_", env_file=ENV_FILES, extra="ignore")
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
    # Vibex가 선택 모델에 추가하는 공용 이전 문맥만 제한
    shared_context_max_tokens: int = Field(default=32_768, ge=1_024)
    shared_context_recent_tokens: int = Field(default=12_288, ge=512)
    shared_context_summary_tokens: int = Field(default=4_096, ge=256)
    task_assets_root: Path = Path(tempfile.gettempdir()) / "vibex-task-assets"
    preview_start_timeout_seconds: float = 180.0
    preview_public_host: str = ""

    @property
    def max_upload_bytes(self) -> int:
        # 사용하는 iPad 기기 스크린 해상도에 따라 LLM에 불필요한 부담 발생 가능성 -> 상한: canvas + base + 폼 필드
        return self.max_image_bytes * 2 + 1024 * 1024

    @property
    def conversation_store_file(self) -> Path:
        """iPad 앱에서 프로젝트 설정 옆에 공용 Vibex 대화 기록을 둠"""
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
