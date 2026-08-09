from __future__ import annotations

from src.projects.preview import PreviewManager, PreviewSession, public_url
from src.projects.registry import Project
from tests.conftest import AUTH


def project(path, **overrides):
    data = {
        "projectId": "demo",
        "displayName": "Demo",
        "repoPath": path,
        "previewCommand": [],
    }
    data.update(overrides)
    return Project.model_validate(data)


def test_vite_project_is_detected(tmp_path):
    (tmp_path / "package.json").write_text(
        '{"scripts":{"dev":"vite"}}', encoding="utf-8"
    )
    assert PreviewManager().can_preview(project(tmp_path))


def test_backend_only_project_has_no_preview(tmp_path):
    assert not PreviewManager().can_preview(project(tmp_path))


def test_ipv6_preview_url_is_valid():
    assert public_url("fd00::1", 4173) == "http://[fd00::1]:4173/"


def test_preview_endpoint_starts_configured_server(client, tmp_path):
    configured = client.app.state.registry.resolve("demo")
    configured.preview_command = ["npm", "run", "dev"]

    class FakePreviews:
        def can_preview(self, project):
            return True

        async def start(self, project, *, public_host):
            return PreviewSession(project.project_id, 43123, None)

        async def stop(self, project_id):
            pass

        async def close(self):
            pass

    client.app.state.previews = FakePreviews()

    response = client.post("/api/v1/projects/demo/preview", headers=AUTH)
    assert response.status_code == 200
    assert response.json()["url"].startswith("http://testserver:")
    assert response.json()["port"] > 1024

    again = client.post("/api/v1/projects/demo/preview", headers=AUTH)
    assert again.json()["port"] == response.json()["port"]


def test_preview_endpoint_explains_missing_frontend(client):
    response = client.post("/api/v1/projects/demo/preview", headers=AUTH)
    assert response.status_code == 409
    assert "package.json" in response.json()["detail"]
