# Vibex — Android 앱 (Flutter)

PC의 라이브 프론트엔드를 태블릿·폰에서 조작하고 그 위에 드로잉하는 앱.
`ipad-app/`의 형제 앱이며 드로잉 엔진을 같은 설계로 구현했다.

## 구성

**드로잉 엔진**
| 파일 | 역할 |
|---|---|
| `canvas/stroke.dart` | `PenKind`·`EraserMode`·`DrawTool`·`Stroke` 모델 |
| `canvas/drawing_controller.dart` | 획 목록·도구·선택·undo/redo 상태 |
| `canvas/drawing_canvas.dart` | 포인터 라우팅(필압·팜 리젝션·지우개·올가미) + 페인터 |
| `canvas/stroke_renderer.dart` | 획 그리기 공용 로직 + 전송용 투명 PNG |
| `canvas/eraser.dart` | 선분 기준 지우개 — 일부(획 쪼개기)/전체 |
| `canvas/lasso.dart` | 올가미 폴리곤 판정 |
| `canvas/shape_snap.dart` | 도형·화살표 인식(항상 ON) |
| `widgets/drawing_toolbar.dart` | 펜·형광펜·지우개·올가미 + 색·두께 툴바 |

**앱 흐름**
| 파일 | 역할 |
|---|---|
| `main.dart` | 홈(PC 연결 / 캔버스 연습장) |
| `screens/connect_screen.dart` | 서버 주소 입력 → 프로젝트 선택 |
| `screens/editor_screen.dart` | WebView 라이브 UI, 드로잉 전환, 좌표 기반 되물음 |
| `api/bridge_client.dart` | REST 클라이언트 |
| `api/models.dart` | 서버 응답 모델 |
| `util/window_capture.dart` | 네이티브 창 캡처(`MainActivity`의 `vibex/snapshot` 채널) |

## 흐름

1. 홈에서 **PC에 연결** → 브리지 주소 입력(에뮬레이터는 `http://10.0.2.2:8787`)
2. 프로젝트 선택 → PC가 시작한 Vite/React 프론트엔드를 WebView에서 직접 조작
3. 드로잉 모드 전환 → 보내기(투명 획 + 현재 라이브 렌더 분리 전송)
4. 작업 상태 폴링 → 되물음 선택지 → 결과

서버 없이 필기 도구만 볼 때는 홈의 **캔버스 연습장**을 연다.

## 실행

```bash
cd flutter-app
flutter pub get
flutter run
```

`flutter analyze`는 경고 없이 통과해야 한다.

## ipad-app과의 관계

두 앱은 드로잉 엔진의 **설계와 상수를 공유한다** — 팔레트 6색, 두께 2/5/9,
지우개 12/24/40, 도형 인식 임계값, 업로드 2048px 상한. 한쪽을 고치면 다른 쪽도
같이 고칠 것.

서버로 가는 것도 같다. 획만 담은 투명 PNG(`canvasImage`)와 현재 렌더
JPEG(`renderedViewImage`)를 같은 픽셀 크기로 따로 보내므로, Bridge는 어느
기기에서 온 요청인지 구분하지 않는다.

## 알려진 제약

- **라이브 렌더 캡처는 Android만 된다.** Flutter의 `RepaintBoundary`는 플랫폼
  뷰(WebView)를 찍지 못해 `MainActivity`에서 창 픽셀을 직접 복사한다. iOS에는
  같은 채널이 없어 `window_capture`가 `null`을 돌려주고, 획만 전송된다.
- 개발 편의를 위해 `allowFingerDrawing`이 켜져 있다. 실기기 배포 전에는 꺼서
  손바닥이 닿을 때 획이 생기지 않게 할 것.
- 되물음 오버레이는 상대좌표(0~1) 기준이라 반응형 레이아웃이 바뀌면 어긋날 수
  있다(iPad 앱은 DOM 앵커를 쓴다).
