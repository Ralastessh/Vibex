from __future__ import annotations

from src.projects.preview import (
    PreviewManager,
    PreviewSession,
    _auto_launch,
    _dependency_install_command,
    public_url,
    vite_allowed_host,
)
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


def test_static_index_without_package_is_detected(tmp_path):
    (tmp_path / "index.html").write_text("<h1>hello</h1>", encoding="utf-8")

    launch = _auto_launch(project(tmp_path), 43123)

    assert launch is not None
    assert launch.cwd == tmp_path
    assert launch.command[-3:] == ["43123", "--bind", "0.0.0.0"]
    assert PreviewManager().can_preview(project(tmp_path))


def test_nested_frontend_package_is_detected_and_runs_from_its_directory(tmp_path):
    frontend = tmp_path / "frontend"
    frontend.mkdir()
    (frontend / "package.json").write_text(
        '{"scripts":{"dev":"vite"}}', encoding="utf-8"
    )

    launch = _auto_launch(project(tmp_path), 43123)

    assert launch is not None
    assert launch.cwd == frontend
    assert launch.command[:3] == ["npm", "run", "dev"]


def test_missing_node_modules_triggers_dependency_install(tmp_path):
    (tmp_path / "package.json").write_text(
        '{"scripts":{"dev":"vite"},"devDependencies":{"vite":"^7"}}',
        encoding="utf-8",
    )
    launch = _auto_launch(project(tmp_path), 43123)

    assert launch is not None
    assert _dependency_install_command(launch) == [
        "npm",
        "install",
        "--no-audit",
        "--no-fund",
    ]


def test_existing_node_modules_skips_dependency_install(tmp_path):
    (tmp_path / "package.json").write_text(
        '{"scripts":{"dev":"vite"}}', encoding="utf-8"
    )
    (tmp_path / "node_modules").mkdir()
    launch = _auto_launch(project(tmp_path), 43123)

    assert launch is not None
    assert _dependency_install_command(launch) is None


def test_existing_vite_host_argument_is_not_duplicated(tmp_path):
    (tmp_path / "package.json").write_text(
        '{"scripts":{"dev":"vite --host 0.0.0.0"}}', encoding="utf-8"
    )
    launch = _auto_launch(project(tmp_path), 43123)

    assert launch is not None
    assert launch.command == [
        "npm",
        "run",
        "dev",
        "--",
        "--port",
        "43123",
    ]


def test_backend_only_project_has_no_preview(tmp_path):
    assert not PreviewManager().can_preview(project(tmp_path))


def test_ipv6_preview_url_is_valid():
    assert public_url("fd00::1", 4173) == "http://[fd00::1]:4173/"


def test_vite_magicdns_allows_current_tailnet_without_machine_name():
    assert (
        vite_allowed_host("ralas-imac.tailb01fc1.ts.net")
        == ".tailb01fc1.ts.net"
    )


def test_vite_short_magicdns_name_is_allowed_exactly():
    assert vite_allowed_host("ralas-imac") == "ralas-imac"


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


def test_preview_short_magicdns_returns_canonical_fqdn(client, monkeypatch):
    configured = client.app.state.registry.resolve("demo")
    configured.preview_command = ["npm", "run", "dev"]

    class FakePreviews:
        async def start(self, project, *, public_host):
            assert public_host == "ralas-imac.tailb01fc1.ts.net"
            return PreviewSession(project.project_id, 43123, None)

        async def close(self):
            pass

    client.app.state.previews = FakePreviews()
    monkeypatch.setattr(
        "src.api.projects.tailscale_self_dns_name",
        lambda: "ralas-imac.tailb01fc1.ts.net",
    )

    response = client.post(
        "/api/v1/projects/demo/preview",
        headers={**AUTH, "host": "ralas-imac:8787"},
    )
    assert response.status_code == 200
    assert response.json()["url"] == "http://ralas-imac.tailb01fc1.ts.net:43123/"


def test_preview_endpoint_explains_missing_frontend(client):
    response = client.post("/api/v1/projects/demo/preview", headers=AUTH)
    assert response.status_code == 409
    assert "package.json" in response.json()["detail"]
