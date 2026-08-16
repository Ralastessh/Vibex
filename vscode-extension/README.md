# Vibex VS Code Extension

Vibex는 VS Code의 Secondary Sidebar에서 실행되는 **독립형 WebView**입니다.
iPad와 같은 VIBEX 공용 대화·프로젝트·작업 상태를 공유하면서,
VS Code Chat의 정보 구조와 상호작용 패턴을 VIBEX UI로 재구현합니다.

한 공용 대화 안에서 Codex와 Claude Code를 턴마다 전환할 수 있습니다. 화면의
타임라인은 바뀌거나 지워지지 않으며, 각 로컬 CLI는 그 대화에 연결된 자기 세션만
이어 씁니다. 한 모델의 과거 내용을 다른 모델의 네이티브 세션에 복제하지 않습니다.

## 사용

1. 저장소에서 `backend/.venv`를 준비합니다.
2. 확장을 실행하거나 VSIX를 설치합니다.
3. 보조 사이드바의 `VIBEX` 탭을 엽니다.
4. 설정에서 프로젝트를 선택하고, 입력창 하단에서 Codex 또는 Claude Code와
   모델·추론 수준·속도·승인 절차를 선택합니다.
5. `+` 버튼으로 선택한 프로젝트 내부의 파일/이미지를 첨부할 수 있습니다.
6. 입력창에서 `/`를 입력하면 실제 명령 목록이, `@`를 입력하면 로컬 에이전트와
   프로젝트 파일 목록이 열립니다.

실행 중에는 로컬 CLI가 공개한 추론·명령·도구 진행을 표시하고, 완료 뒤에는 최종
답변과 실제 모델/토큰 또는 Claude 비용만 남깁니다. 응답 하단의 다시 생성, 복사,
평가, 크게 열기 버튼은 모두 실제 동작에 연결되어 있습니다. 로컬 Codex CLI에는
Copilot의 `credits` 단위가 없으므로 존재하지 않는 크레딧을 추정해 표시하지 않습니다.

확장은 Bridge를 `127.0.0.1:8787`에 자동 실행합니다. 물리 iPad는 같은 tailnet에
로그인한 뒤 MagicDNS 주소 `http://vibex-pc:8788`을 사용합니다. Tailscale 인증키는
Vibex에 입력하거나 저장하지 않습니다.

## 독립성

`vscode-copilot-chat-main`의 모듈, 함수, 빌드 산출물 또는 런타임 API를 import하지
않습니다. WebView는 이 확장의 `media/main.js`, `media/styles.css`,
`src/extension.js`만으로 동작하므로 참고 저장소를 삭제해도 영향을 받지 않습니다.
참고한 MIT 라이선스 고지는 `THIRD_PARTY_NOTICES.md`에 보존합니다.
