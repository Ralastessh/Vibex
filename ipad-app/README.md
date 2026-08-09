# Vibex — iPad 앱 (SwiftUI · PencilKit)

PC의 라이브 프론트엔드를 iPad에서 조작하고 그 위에 드로잉하는 통합 앱.

Swift 전체 소스는 iOS 16 시뮬레이터 SDK 기준 `swiftc -typecheck`를 통과했다.

## 구성

**엔진 (main에서 채택 — 손대지 않음)**
| 파일 | 역할 |
|---|---|
| `LivePreviewEditorView.swift` | WKWebView 라이브 UI, 드로잉 전환, 좌표 기반 질문 객체 |
| `AnnotationCanvasView.swift` | 개발 하네스용 정적 이미지 주석 캔버스 |
| `PencilCanvas.swift` | PKCanvasView + 도형 스냅 + undo(`setDrawingUndoably`) |
| `CanvasComposer.swift` | 획/현재 라이브 렌더 분리(획 PNG + 렌더 JPEG, 2048px 상한) |
| `BridgeClient.swift` | REST 클라이언트 + 응답 모델 전부 |
| `ShapeSnap.swift` | 도형 인식 |

**앱 흐름 (mhj에서 이식 — main API에 맞춤)**
| 파일 | 역할 |
|---|---|
| `VibexApp.swift` | `@main` → RootView |
| `RootView.swift` | 연결설정·프로젝트목록·라이브 프리뷰 시작·작업상태 |
| `EventStream.swift` | WebSocket 이벤트(보조; 현재 미연결, 폴링이 주 경로) |
| `HarnessView.swift` | 개발용 시험 화면 + 샘플 스크린샷(진입점 아님) |
| `project.yml` | XcodeGen 스펙 + Info.plist·ATS |

## 흐름

1. 설정(⚙️)에 Bridge 주소 + 기기 토큰 입력 (main 하네스와 `bridgeBaseURL`/`bridgeToken` 공유)
2. 프로젝트 목록(상태 점) → 프로젝트 선택
3. PC가 시작한 Vite/React 프론트엔드를 WKWebView에서 직접 조작
4. 드로잉 모드 전환 → 보내기(투명 획+현재 라이브 렌더 분리 전송)
5. CLI 작업 상태 폴링 → 좌표 기반 유리 질감 선택지 → 변경 파일·테스트 결과

## 빌드 (macOS)

```bash
brew install xcodegen
cd ipad-app
xcodegen generate
open Vibex.xcodeproj
```
서명 팀만 본인 걸로 설정하고 실기기 실행.

## 통합에서 바뀐 것

- 겹치던 5파일은 **main 버전 채택**(에러 처리·재전송 중복 방지·이미지 상한 등이 더 완성).
- mhj의 중복 파일(`AppConfig`·`BridgeModels`) 제거 — 설정은 `@AppStorage`, 모델은 main 것 사용.
- `@main`은 RootView 하나로 통일, main의 하네스는 `HarnessView`로 남김.

## 남은 것

- WebSocket(`EventStream`) 실제 연결 — 이벤트 페이로드 형태 백엔드와 확인 후.
- 회전/분할 화면, 온보딩, 새 프로젝트 생성 시트(백엔드 `POST /projects`는 있음).
