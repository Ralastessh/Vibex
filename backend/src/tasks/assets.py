from __future__ import annotations

import shutil
import uuid
from pathlib import Path


class TaskAssetStore:
    """iPad 이미지를 CLI가 읽을 수 있는 PC 로컬 임시 파일로 보관한다."""

    def __init__(self, root: Path) -> None:
        self.root = root.expanduser().resolve()

    def save(self, task_id: str, files: list[tuple[str, bytes]]) -> list[Path]:
        directory = self.root / task_id
        directory.mkdir(parents=True, exist_ok=False, mode=0o700)
        paths: list[Path] = []
        for filename, data in files:
            path = directory / filename
            path.write_bytes(data)
            paths.append(path)
        return paths

    def cleanup(self, paths: list[Path]) -> None:
        if not paths:
            return
        directory = paths[0].resolve().parent
        if directory.parent != self.root or not directory.is_dir():
            return
        shutil.rmtree(directory)

    def resolve(self, task_id: str, name: str) -> Path | None:
        if not task_id or Path(name).name != name:
            return None
        candidate = (self.root / task_id / name).resolve()
        expected_parent = (self.root / task_id).resolve()
        if candidate.parent != expected_parent or not candidate.is_file():
            return None
        return candidate

    def cleanup_all(self) -> None:
        if not self.root.is_dir():
            return
        # 설정 실수로 root가 넓은 폴더를 가리켜도 Vibex 작업 UUID 폴더 외에는
        # 절대 삭제하지 않는다.
        for candidate in self.root.iterdir():
            try:
                uuid.UUID(candidate.name)
            except ValueError:
                continue
            if candidate.is_dir() and candidate.parent == self.root:
                shutil.rmtree(candidate)
        try:
            self.root.rmdir()
        except OSError:
            pass
