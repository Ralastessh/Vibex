# Vibex — iPad 앱 (SwiftUI · PencilKit)

main의 캔버스·전송 엔진 위에 실제 앱 흐름(목록 → 캔버스 → 작업 상태)을 얹은 통합본.

> ⚠️ **미검증.** Windows에서 작성해 컴파일하지 못했다. macOS + Xcode에서 빌드하며
> 팀에서 확인한다. `ShapeSnap`만 이전에 macOS에서 실측 통과.

## 구성

**엔진 (main에서 채택 — 손대지 않음)**
| 파일 | 역할 |
|---|---|
| `AnnotationCanvasView.swift` | 스크린샷 위 주석 캔버스, 전송까지 내부 처리 |
| `PencilCanvas.swift` | PKCanvasView + 도형 스냅 + undo(`setDrawingUndoably`) |
| `CanvasComposer.swift` | 획/배경 분리 스냅샷(획 PNG + 배경 JPEG, 2048px 상한) |
| `BridgeClient.swift` | REST 클라이언트 + 응답 모델 전부 |
| `ShapeSnap.swift` | 도형 인식 |

**앱 흐름 (mhj에서 이식 — main API에 맞춤)**
| 파일 | 역할 |
|---|---|
| `VibexApp.swift` | `@main` → RootView |
| `RootView.swift` | 연결설정·프로젝트목록·스크린샷선택·작업상태(폴링/승인/질문응답) |
| `EventStream.swift` | WebSocket 이벤트(보조; 현재 미연결, 폴링이 주 경로) |
| `HarnessView.swift` | 개발용 시험 화면 + 샘플 스크린샷(진입점 아님) |
| `project.yml` | XcodeGen 스펙 + Info.plist·ATS |

## 흐름

1. 설정(⚙️)에 Bridge 주소 + 기기 토큰 입력 (main 하네스와 `bridgeBaseURL`/`bridgeToken` 공유)
2. 프로젝트 목록(상태 점) → 프로젝트 선택
3. 스크린샷 선택(사진) 또는 "샘플 화면으로 시험"
4. 캔버스에 주석 → 보내기(획+배경 분리 전송)
5. 작업 상태 폴링 → 해석 승인 / 탭 질문응답 → 변경 파일·테스트 결과

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
