from __future__ import annotations

import shutil
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
