# Vibex VS Code Extension

VS Code의 Secondary Sidebar에서 iPad와 같은 Vibex 프로젝트, 작업 상태 및
Codex/Claude Code 선택을 관리합니다. 확장은 LLM 프로세스를 별도로 실행하지 않고
FastAPI Bridge를 사용하므로 iPad와 프로젝트 잠금 및 세션 ID를 공유합니다.

## 개발 실행과 iPad 연결

1. Mac의 Tailscale에 로그인하고 CLI를 사용할 수 있게 합니다.
2. 저장소 루트를 VS Code로 열고 `Run and Debug`에서 `Vibex Extension`을 실행합니다.
3. 새 Extension Development Host의 보조 사이드바에서 `VIBEX`를 선택합니다.
4. 패널이 `backend/.venv`를 찾아 Bridge를 `127.0.0.1:8787`에 자동 실행합니다.
5. 패널이 Mac의 Tailscale 머신 이름을 `vibex-pc`로 맞추고 HTTP Serve를
   자동 구성합니다. 같은 tailnet에 로그인한 물리 iPad는 MagicDNS로 바로 연결됩니다.

명령 팔레트의 `Vibex: Open Vibex`, `Vibex: Configure Bridge Connection`도
사용할 수 있습니다. 자동 탐색이 실패하면 `vibex.backendPath`만 지정하면 됩니다.
시뮬레이터는 `127.0.0.1:8787`을 사용합니다. Tailscale 인증키는 Vibex에
입력하거나 저장하지 않습니다.
