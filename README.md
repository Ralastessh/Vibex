# Vibex
PC, 태블릿PC, 스마트폰에서 바이브코딩을 지속할 수 있는 워크플로우 개발 툴

## 개발 목적
LLM과 에이전트를 활용한 바이브코딩은 누구나 빠르게 아이디어를 구현하고 코딩할 수 있게 만들어주었습니다. 
하지만 이런 코딩 경험은 여전히 책상 위의 PC에 묶여 있습니다. 대부분의 시간을 보내는 출퇴근길, 근무 중에도 아이디어는 계속 떠오르지만, 개발은 여전히 멈춰있습니다.
스마트폰이나 태블릿PC의 작은 화면에서 원격 접속을 하거나 불편한 키보드 입력을 반복하는 일은 번거롭고 일상의 흐름 속에서 개발의 몰입을 끊깁니다.

## 아이디어
스마트폰과 태블릿PC에서도 터치와 터치펜처럼 각 기기에 이미 최적화된 방식으로 PC의 에이전트와 소통하며, 언제 어디서나 작업을 맡길 수 있습니다. 
더 이상 불편한 조작으로 개발을 이어나갈 필요가 없습니다. 회의실에서 남긴 메모가 개발 지시가 되고, 출근길의 터치 몇 번이 작업 방향을 바꿉니다. 
더 이상 시공간의 구애를 받지 않고, 일상에서 아이디어가 떠오르는 순간이 곧 작업이 시작되는 순간이 됩니다.


## 작동 방식

```
iPad                     Tailscale          iMac
────────────────────────────────────────────────────────────────
WKWebView 라이브 UI ◀───────────────────── Vite/React dev server
버튼·검색창 조작   ─────────────────────▶ (실시간 상호작용/HMR)
펜으로 그리기      ─────────────────────▶ Bridge
                                         ├─▶ 현재 렌더 + 투명 획을 PC 임시 저장
                                         ├─▶ 해당 Claude/Codex 세션에 이미지 첨부
                                         │     이미지 해석 + 코드 수정 + 테스트
좌표 기반 선택지   ◀─────────────────────────┤
선택 피드백        ─────────────────────▶ 같은 CLI 세션 resume
변경 파일 · 테스트 ◀─────────────────────────┘
```

```
┌─────────────────────────────┐
│ iPad App                    │
│ SwiftUI + PencilKit         │
│ URLSession + WebSocket      │
└──────────────┬──────────────┘
               │
        Tailscale Network
               │
┌──────────────▼──────────────┐
│ PC Bridge                   │
│ FastAPI                     │
│                             │
│ POST /tasks                 │
│ GET /projects               │
│ POST /projects/{id}/preview │
│ WS /tasks/{id}/events       │
│                             │
│ Project Registry            │
│ Session Resolver            │
│ Claude/Codex Adapter        │
└──────────────┬──────────────┘
               │
   subprocess / CLI · App Server
               │
┌──────────────▼──────────────┐
│ Claude Code 또는 Codex       │
│ Existing Repository/Session │
└─────────────────────────────┘
```

### 다섯 단계

1. **실행** — PC가 프로젝트 개발 서버를 시작하고 iPad가 라이브 UI를 연다.
2. **상호작용** — 실제 버튼·입력창·라우팅을 사용해 원하는 상태로 이동한다.
3. **그리기** — 드로잉 모드에서 현재 라이브 렌더 위에 수정 의도를 표시한다.
4. **CLI 처리** — 현재 렌더와 투명 획을 해당 Claude/Codex 세션에 직접 첨부해 코드 수정과 테스트를 맡긴다.
5. **피드백** — 모호한 요소는 좌표 기반 유리 질감 객체와 선택지로 표시하고 선택 결과를 같은 세션에 돌려보낸다.

## iPad 앱
단순 그림판이 아니라 프로젝트를 관리하는 작업 공간입니다.

```
┌────────────────┬───────────────────────────────────────┐
│ ⚙  검색         │  모든 프로젝트            [+ 새 프로젝트]    │
│                │  전체 · 최근 · 작업 중 · 사용 불가           │
│ 📁 모든 프로젝트  │ ────────────────────────────────────── │
│                │  ▨  Moonwalk        [대기]   moonwalk   │
│ 프로젝트     +   │  ▨  Demo React App  [작업 중] demo       │
│  ● Moonwalk    │                                        │
│  ● Demo        │                                        │
│                │                                        │
│ ● Bridge 연결됨  │                                        │
└────────────────┴────────────────────────────────────────┘
```

- **프로젝트별 관리** — 상태 점으로 대기/작업 중/사용 불가를 한눈에
- **새 프로젝트 생성 · 기존 프로젝트 접속**
- **CLI 송수신** — 대화 스레드에서 그림이나 텍스트를 보내고 결과 받기
- **대화 공유** — iPad와 VS Code가 같은 VIBEX 대화를 열고 텍스트·드로잉 작업을 함께 확인
- **iPad 선택 피드백** — 드로잉 요청이 모호하면 선택지 또는 직접 입력으로 답한다
- **연결이 끊겨도** iMac은 작업을 계속하고, 재접속하면 결과가 그대로 있음

---

## 기술 구성

| 영역 | 사용 |
|---|---|
| iPad 앱 | SwiftUI · PencilKit (iPadOS 17+) |
| PC와 태블릿PC 간 연결 소스 | Python 3.12+ · FastAPI |
| 그림 해석·코드 수정 | Claude Code CLI 또는 Codex CLI(ChatGPT 로그인) |
| 원격 연결 | Tailscale |

OpenAI Platform API나 `OPENAI_API_KEY`는 사용하지 않습니다. Codex를 선택한
턴은 PC에 로그인되어 있는 Codex와 공식 App Server로 통신하고, Claude Code를
선택한 턴은 로컬 Claude CLI로 실행합니다. VS Code와 iPad에 표시되는 대화의
기준은 VIBEX 공용 `conversationId`입니다. 모델을 바꿔도 이 타임라인은 유지되며,
각 모델의 네이티브 세션 ID는 같은 공용 대화 아래에 모델별로 따로 보관합니다.
다른 모델의 대화 이력을 네이티브 세션에 강제로 복제하지 않습니다.

같은 네이티브 thread가 VS Code나 터미널에서 이미 응답을 생성 중이면 두 실행 주체가 동시에
쓰지 않도록 iPad 요청은 실패 처리됩니다. 현재 응답이 끝난 뒤 다시 전송하면 같은
thread를 재개하며, 충돌을 피하려고 별도의 대화를 임의로 만들지는 않습니다.

## 프로젝트 설정

`BRIDGE_WORKSPACE_ROOT` 아래의 Git 저장소는 iPad 프로젝트 목록에 자동으로
표시됩니다. `backend/projects.local.json`은 자동 발견된 프로젝트의 CLI와
프론트엔드 실행 방식을 덮어쓰는 선택 설정입니다. 작업 루트 안의
프로젝트는 `repoPath`를 쓰지 않아도 됩니다.

```json
{
  "projects": [
    {
      "projectId": "demo",
      "displayName": "Demo React App",
      "agent": "codex-cli",
      "testCommands": ["npm test"],
      "previewCommand": ["npm", "run", "dev", "--", "--host", "{host}", "--port", "{port}"]
    }
  ]
}
```

Vite/Next 프로젝트는 `package.json`의 `dev` 스크립트를 자동 탐지하므로
`previewCommand`를 생략할 수 있습니다. iPad는 Bridge 주소에 사용한 PC/Tailscale
호스트와 프리뷰 포트를 조합해 직접 접속합니다.

## PC Bridge 실행

처음 한 번 백엔드 가상환경을 준비합니다.

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r requirements.txt
```

`backend/.env`에는 OpenAI 키 없이 작업 루트만 둡니다.
Vibex는 이 루트에서 프로젝트를 찾고, iPad에서 생성한 프로젝트도
같은 루트에 만듭니다.

```dotenv
BRIDGE_WORKSPACE_ROOT=/Users/사용자/Desktop/Vibex/test-projects
# 선택: 이 계정만 Tailscale Serve를 통해 접근 허용
BRIDGE_TAILSCALE_ALLOWED_USERS=user@example.com
```

VS Code의 VIBEX 패널을 열면 Bridge가 `127.0.0.1:8787`에서 자동 실행됩니다.
수동으로 확인할 때만 다음 명령을 사용합니다.

```bash
cd backend
.venv/bin/uvicorn src.main:app --host 127.0.0.1 --port 8787
```

Mac과 물리 iPad의 Tailscale 앱에 같은 tailnet으로 로그인합니다. VIBEX 패널은
Mac의 Tailscale 머신 이름을 `vibex-pc`로 맞추고 Serve를 자동 구성합니다. iPad는
주소 입력 없이 MagicDNS의 `http://vibex-pc:8788`로 바로 접속합니다. iPad
시뮬레이터는 Tailscale 없이 `http://127.0.0.1:8787`에 자동 연결됩니다.
작업 루트나 `projects.local.json`을 바꾼 뒤에는 Bridge를 재시작해야 합니다.

## VS Code VIBEX 패널

`vscode-extension/`에는 Codex와 Claude Code를 함께 관리하는 VS Code 확장이
있습니다. 공식 Codex/Claude 패널과 같은 Secondary Sidebar 위치에 `VIBEX` 탭을
추가하며, iPad와 동일한 Bridge를 사용하므로 공용 대화·프로젝트 잠금·작업 결과가
하나로 유지됩니다.

개발 중에는 저장소 루트를 VS Code로 열고 `Run and Debug`에서
`Vibex Extension`을 실행합니다. 새 Extension Development Host에서 `VIBEX` 탭을
열면 백엔드 경로를 자동으로 찾아 실행합니다. 자동 탐색이 실패할 때만 설정에서
`vibex.backendPath`를 지정합니다.

패널에서 같은 대화를 유지한 채 턴별 Codex/Claude 선택, 텍스트 작업 전송, 진행
상태 확인, 리뷰 및 작업 취소를 수행할 수 있습니다. 모호한 드로잉에 대한 선택지
답변 UI는 iPad 앱에만 표시됩니다.

```
src/             PC와 태블릿PC 간 연결 오픈소스
ipad-app/        iPad 앱 — Swift 파일
vscode-extension/ VS Code Secondary Sidebar WebView
docs/            개발 계획 및 검증 기록
protocol/        예제 스케치 이미지
examples/        데모용 React 로그인 화면
scripts/         실행·샘플 생성 스크립트
CLAUDE.md        구현 명세서
```
