# Vibex — iPad 앱 (SwiftUI · PencilKit)

PC의 라이브 프론트엔드를 iPad에서 조작하고 그 위에 드로잉하는 통합 앱.

Swift 전체 소스는 iOS 16 시뮬레이터 SDK 기준 `swiftc -typecheck`를 통과했다.

## 구성

**엔진 (main에서 채택 — 손대지 않음)**
| 파일 | 역할 |
|---|---|
| `LivePreviewEditorView.swift` | WKWebView 라이브 UI, 드로잉 전환, 좌표 기반 질문 객체 |
| `AnnotationCanvasView.swift` | 개발 하네스용 정적 이미지 주석 캔버스 |
| `PencilCanvas.swift` | PKCanvasView + 화살표·도형 자동 인식 + Pencil/손가락 분리 + undo(`setDrawingUndoably`) |
| `ProjectBlueprintView.swift` | 새 프로젝트 설정 + UI/워크플로/특이사항 다중 페이지 드로우코딩 |
| `CanvasComposer.swift` | 획/현재 라이브 렌더 분리(획 PNG + 렌더 JPEG, 2048px 상한) |
| `BridgeClient.swift` | REST 클라이언트 + 응답 모델 전부 |
| `ShapeSnap.swift` | 도형 인식 |

**앱 흐름 (mhj에서 이식 — main API에 맞춤)**
| 파일 | 역할 |
|---|---|
| `VibexApp.swift` | `@main` → RootView |
| `RootView.swift` | MagicDNS 자동 연결·프로젝트목록·라이브 프리뷰 시작·작업상태 |
| `EventStream.swift` | WebSocket 이벤트(보조; 현재 미연결, 폴링이 주 경로) |
| `HarnessView.swift` | 개발용 시험 화면 + 샘플 스크린샷(진입점 아님) |
| `project.yml` | XcodeGen 스펙 + Info.plist·ATS |

## 흐름

1. 물리 iPad는 Tailscale에 로그인한 뒤 연결 설정에서 온라인 VIBEX PC를 선택
   (처음 보는 PC는 MagicDNS 이름을 한 번 추가, 시뮬레이터는 `127.0.0.1:8787` 자동 연결)
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
- 새 프로젝트는 `+ 새 프로젝트`에서 이름과 에이전트를 고른 뒤 UI·레이아웃,
  워크플로 차트, 기타 특이사항 페이지를 Apple Pencil로 작성합니다. 페이지를
  추가·복제·삭제할 수 있고, 격자/점/무지 템플릿과 펜·형광펜·지우개·올가미·
  색·굵기·undo/redo를 지원합니다. 화살표와 기본 도형은 별도 모드 없이
  손그림에서 자동 변환됩니다.
- `구현 시작`은 PC 작업 루트에 Git 프로젝트와 공용 대화를 만든 다음 전체
  설계 문서를 첫 LLM CLI 작업으로 전송합니다. 중간 네트워크 실패 시 이미
  생성한 프로젝트를 재사용하므로 재시도로 중복 폴더를 만들지 않습니다.
