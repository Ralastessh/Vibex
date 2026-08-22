# Vibex — iPad 앱 (SwiftUI)

PC의 라이브 프론트엔드를 iPad에서 조작하고 그 위에 드로잉하는 통합 앱.

> 드로잉 엔진 교체(PencilKit 제거) 이후로는 macOS에서 빌드 검증을 못 했다. Xcode 빌드 확인 필요.

## 구성

**드로잉 엔진 (flutter-app과 1:1로 맞춘 자체 구현)**
| 파일 | 역할 |
|---|---|
| `Stroke.swift` | `PenKind`·`EraserMode`·`DrawTool`·`Stroke` 모델 + `UIColor(hex:)` |
| `DrawingController.swift` | 획 목록·도구·선택·undo/redo 상태 |
| `DrawingCanvas.swift` | 터치 라우팅(필압·팜 리젝션·지우개·올가미·핀치) + 렌더 |
| `StrokeRenderer.swift` | 획 그리기 공용 로직 + 전송용 투명 PNG(2048px 상한) |
| `Eraser.swift` | 선분 기준 지우개 — 일부(획 쪼개기)/전체 |
| `Lasso.swift` | 올가미 폴리곤 판정 |
| `ShapeSnap.swift` | 도형·화살표 인식(항상 ON) |
| `DrawingToolbar.swift` | 펜·형광펜·지우개·올가미 + 색·두께 툴바 |
| `DrawingSandboxView.swift` | 서버 없이 캔버스만 여는 연습장(목록 화면 ✎ 버튼) |

**앱 흐름**
| 파일 | 역할 |
|---|---|
| `VibexApp.swift` | `@main` → RootView |
| `RootView.swift` | MagicDNS 자동 연결·프로젝트목록·라이브 프리뷰 시작·작업상태 |
| `LivePreviewEditorView.swift` | WKWebView 라이브 UI, 드로잉 전환, 좌표 기반 질문 객체 |
| `AnnotationCanvasView.swift` | 개발 하네스용 정적 이미지 주석 캔버스 |
| `CanvasComposer.swift` | 획/현재 라이브 렌더 분리(획 PNG + 렌더 JPEG) |
| `BridgeClient.swift` | REST 클라이언트 + 응답 모델 전부 |
| `EventStream.swift` | WebSocket 이벤트(보조; 현재 미연결, 폴링이 주 경로) |
| `HarnessView.swift` | 개발용 시험 화면 + 샘플 스크린샷(진입점 아님) |
| `project.yml` | XcodeGen 스펙 + Info.plist·ATS |

## 흐름

1. 물리 iPad는 Tailscale에 로그인하면 `vibex-pc:8788`로 자동 연결
   (시뮬레이터는 `127.0.0.1:8787` 자동 연결)
2. 프로젝트 목록(상태 점) → 프로젝트 선택
   - 서버 없이 필기만 시험하려면 목록 화면 오른쪽 위 ✎ → 캔버스 연습장
3. PC가 시작한 Vite/React 프론트엔드를 WKWebView에서 직접 조작
4. 드로잉 모드 전환 → 보내기(투명 획+현재 라이브 렌더 분리 전송)
   - 펜/형광펜/지우개(일부·전체)/올가미, 도형·화살표 자동 인식, 두 손가락 핀치 확대
5. CLI 작업 상태 폴링 → 좌표 기반 유리 질감 선택지 → 변경 파일·테스트 결과

## 빌드 (macOS)

```bash
brew install xcodegen
cd ipad-app
xcodegen generate
open Vibex.xcodeproj
```
서명 팀만 본인 걸로 설정하고 실기기 실행.

## flutter-app과의 관계

`flutter-app/`이 같은 기능을 Dart로 구현한 형제 앱이다. 드로잉 엔진은 두 앱이 같은
설계·같은 상수를 쓴다(팔레트 6색, 두께 2/5/9, 지우개 12/24/40, 스냅 임계값, 2048px 상한).
한쪽을 고치면 다른 쪽도 같이 고칠 것.

PencilKit은 걷어냈다. `PKLassoTool`은 무엇이 선택됐는지 코드로 읽을 수 없고,
`PKEraserTool`의 일부/전체는 iOS 16.4+에서만 굵기를 지정할 수 있으며,
라이브 프리뷰와 획을 같은 배율로 확대하려면 획 좌표를 직접 들고 있어야 했다.

## 남은 것

- WebSocket(`EventStream`) 실제 연결 — 이벤트 페이로드 형태 백엔드와 확인 후.
- 회전/분할 화면, 온보딩, 새 프로젝트 생성 시트(백엔드 `POST /projects`는 있음).
- 확대한 상태에서는 되물음 오버레이 좌표가 라이브 화면과 어긋난다(질문 중엔 그리기가 막히므로 실사용엔 영향 적음).
