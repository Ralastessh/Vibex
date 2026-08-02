# Vibex — iPad 앱 (SwiftUI · PencilKit)

주석 캔버스 + 앱 셸 + Bridge 네트워크 계층. "프로젝트 고르기 → 스크린샷 위에 펜으로
수정 표시 → 전송 → 해석 승인 → 코드 수정·테스트 결과" 흐름의 프론트엔드다.

> ⚠️ **미검증.** Windows에서 작성했고 컴파일하지 못했다. macOS + Xcode에서 빌드하며
> 팀원이 검증한다는 전제. `ShapeSnap`만 이전에 macOS에서 실측 통과했다.

## 파일

| 파일 | 역할 |
|---|---|
| `VibexApp.swift` | `@main` 진입점 |
| `RootView.swift` | 화면 흐름 — 연결설정·프로젝트목록·스크린샷선택·캔버스·작업상태(승인/질문응답) |
| `AnnotationCanvasView.swift` | 스크린샷 배경 + PencilKit 캔버스 + 떠 있는 툴바 |
| `PencilCanvas.swift` | PKCanvasView 래퍼 + 도형 스냅 (팜리젝션 `.pencilOnly`, undo 등록) |
| `ShapeSnap.swift` | 손그림 → 네모·원·세모 인식 (실측 통과) |
| `CanvasComposer.swift` | 획-only PNG 내보내기(전송용) + 미리보기 합성 |
| `BridgeClient.swift` | REST 클라이언트 (projects/tasks/confirm/answer/cancel) |
| `BridgeModels.swift` | 백엔드 응답 Codable 모델 |
| `EventStream.swift` | WebSocket 진행 이벤트 수신 (보조; 폴링이 주 경로) |
| `AppConfig.swift` | 연결 설정(주소·토큰) UserDefaults 저장 |
| `project.yml` | XcodeGen 스펙 (Info.plist·ATS 포함) |

의존성은 Apple 프레임워크뿐(PencilKit·PhotosUI). 대상 **iPadOS 16+**.

## 빌드

**XcodeGen (권장):**
```bash
brew install xcodegen
cd ipad-app
xcodegen generate
open Vibex.xcodeproj
```
Xcode에서 서명 팀(DEVELOPMENT_TEAM)만 본인 걸로 설정하고 실기기에 실행.

**수동:** Xcode에서 새 iOS App(SwiftUI) 만들고 이 `.swift`들을 넣은 뒤, Info.plist에
`NSAppTransportSecurity → NSAllowsArbitraryLoads = YES`를 추가(개발용 http Bridge).

## 연결 설정

앱 첫 실행 → 톱니바퀴(설정)에서:
- **Bridge 주소**: Mac의 Tailscale 주소, 예 `http://100.x.x.x:8000`
- **기기 토큰**: 백엔드의 `BRIDGE_DEVICE_TOKEN`과 **같은 값**

토큰은 코드·저장소에 넣지 않고 기기(UserDefaults)에 저장한다. 실배포라면 Keychain으로.

## 백엔드 계약 (김준수, jskim 브랜치 기준)

모든 요청에 `Authorization: Bearer <토큰>`. 베이스 `/api/v1`.
- `GET /projects` → 프로젝트 목록(상태 idle/busy/unavailable)
- `POST /tasks` (multipart): `projectId` + **`canvasImage`(획)** + **`baseImage`(스크린샷)**
- `GET /tasks/{id}` → 상태·결과(폴링), `POST /tasks/{id}/confirm|answer|cancel`
- `WS /events` → 진행 이벤트

**중요:** 획과 스크린샷을 **분리 전송**한다(합성 한 장 아님). Vision이 둘을 별개 레이어로
해석하기 때문. 이건 백엔드가 이미 정한 계약에 맞춘 것.

## PLAN 대비 진척 (문희주)

| 항목 | 상태 |
|---|---|
| 1주차: Xcode 프로젝트·설치 | 🔶 `project.yml`로 스캐폴드(생성·실기기 실행은 macOS에서) |
| 2주차 함정: ATS | ✅ `NSAllowsArbitraryLoads`(개발용) |
| 2주차: PencilKit 캔버스·툴바·주석·PNG | 🔶 작성됨(미검증), 획-only 내보내기로 정정 |
| 2주차: 백엔드 연결(목록 로드) | 🔶 `listProjects` + 목록 화면 |
| 3주차: 승인·질문응답·상태·폴링 | 🔶 최소 구현(TaskStatusView) |
| 3주차: WebSocket | 🔶 `EventStream` 골격(**이벤트 페이로드 형태는 김준수와 확인 필요**) |
| 3주차: 새 프로젝트 시트 | ❌ 미구현(백엔드 `POST /projects`는 있음) |
| 4주차: 오류/빈상태/온보딩/회전/데모 | ❌ 이후 |

## 알려진 한계 · 후속

- **회전/분할화면**: 배경 aspectFill과 획 좌표가 어긋날 수 있음(4주차). 데모는 방향 고정 권장.
- **도형 스냅 트리거**: hold가 아니라 "획 뗀 순간"(PencilKit이 진행중 획 미노출). 토글로 on/off.
- **큰 스크린샷**: `baseImage`가 크면 10MB 상한 근접 가능 → 전송 전 다운스케일 검토.
- **WebSocket 이벤트 스키마 미확정** → 지금은 폴링(GET /tasks/{id})이 상태 갱신의 주 경로.
- **미검증**: 컴파일은 macOS에서. 동시성 경고 몇 개는 정리 대상일 수 있음.
