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
- **탭으로만 답하기** — 에이전트가 되물으면 선택지를 누른다. 타이핑을 요구하지 않음
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
프로젝트는 PC에 로그인되어 있는 Codex와 공식 App Server로 통신합니다. 저장소의
정확한 경로가 일치하는 기존 thread를 찾고, VS Code에서 만든 thread를 우선해
재개합니다. 일치하는 thread가 없을 때만 새 thread를 만듭니다. 새 thread 역시
Codex의 공용 로컬 세션 저장소에 남으므로 이후 PC에서 이어갈 수 있습니다.

같은 thread가 VS Code나 터미널에서 이미 응답을 생성 중이면 두 실행 주체가 동시에
쓰지 않도록 iPad 요청은 실패 처리됩니다. 현재 응답이 끝난 뒤 다시 전송하면 같은
thread를 재개하며, 충돌을 피하려고 별도의 대화를 임의로 만들지는 않습니다.

## 프로젝트 설정

`backend/projects.local.json`에서 프로젝트별 CLI와 프론트엔드 실행 방식을 정합니다.

```json
{
  "projects": [
    {
      "projectId": "demo",
      "displayName": "Demo React App",
      "repoPath": "~/Desktop/demo-react-app",
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

`backend/.env`에는 OpenAI 키 없이 기기 토큰과 새 프로젝트 생성 위치만 둡니다.

```dotenv
BRIDGE_DEVICE_TOKEN=충분히-긴-임의-문자열
BRIDGE_WORKSPACE_ROOT=/Users/사용자/Desktop/Vibex/test-projects
```

그다음 PC에서 Bridge를 실행합니다.

```bash
cd backend
.venv/bin/uvicorn src.main:app --host 0.0.0.0 --port 8787
```

iPad 앱에는 `http://PC의-Tailscale-IP:8787`과 같은 Bridge 주소와 동일한 기기
토큰을 입력합니다. `projects.local.json`을 바꾼 뒤에는 레지스트리를 다시 읽도록
Bridge를 재시작해야 합니다.

```
src/             PC와 태블릿PC 간 연결 오픈소스
ipad-app/        iPad 앱 — Swift 파일
docs/            개발 계획 및 검증 기록
protocol/        예제 스케치 이미지
examples/        데모용 React 로그인 화면
scripts/         실행·샘플 생성 스크립트
CLAUDE.md        구현 명세서
```
