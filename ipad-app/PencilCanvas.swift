import PencilKit
import SwiftUI

extension PKCanvasView {
    /// `drawing`에 직접 대입하면 **undo 스택에 남지 않는다.**
    /// 되돌릴 수 있어야 하는 변경은 전부 이 경로로 보낸다.
    func setDrawingUndoably(_ newDrawing: PKDrawing, actionName: String) {
        let previous = drawing
        undoManager?.registerUndo(withTarget: self) { target in
            // undo 처리 안에서 다시 등록하므로 redo도 같은 경로로 동작한다.
            target.setDrawingUndoably(previous, actionName: actionName)
        }
        undoManager?.setActionName(actionName)
        drawing = newDrawing
    }
}

// 툴바에서 고르는 도구.
enum PenKind: String, CaseIterable {
    case pen, marker, eraser, lasso
    var usesColor: Bool { self == .pen || self == .marker }
}

// 지우개 방식: 획 일부만 지우기(픽셀) vs 획 통째로 지우기(오브젝트).
enum EraserMode: Equatable {
    case pixel   // 닿은 픽셀만 지움 → 획 일부가 남음
    case object  // 닿은 획 전체를 지움
}

struct DrawTool: Equatable {
    static let palette = ["#111111", "#2f6bff", "#e0564a", "#1f9d55", "#f59e0b", "#8b5cf6"]

    var kind: PenKind = .pen
    var colorHex: String = "#111111"
    var width: CGFloat = 5
    // 지우개는 펜과 굵기 척도가 달라 따로 둔다(도구 전환 시 굵기가 넘어오지 않게).
    var eraserWidth: CGFloat = 24
    var eraserMode: EraserMode = .pixel

    var pkTool: PKTool {
        let color = UIColor(hex: colorHex)
        switch kind {
        case .pen: return PKInkingTool(.pen, color: color, width: width)
        case .marker: return PKInkingTool(.marker, color: color, width: max(width * 3, 16))
        case .eraser:
            // width 지정 지우개와 .vector(획 전체) 지우개는 iOS 16.4+.
            // 그 이전은 픽셀 고정 크기로 폴백.
            if #available(iOS 16.4, *) {
                let type: PKEraserTool.EraserType = eraserMode == .object ? .vector : .bitmap
                return PKEraserTool(type, width: eraserWidth)
            } else {
                return PKEraserTool(.bitmap)
            }
        case .lasso: return PKLassoTool()
        }
    }
}

/// 라이브 프론트엔드 위에서 Apple Pencil 입력만 캔버스가 받고, 손가락 입력은
/// 아래 WKWebView로 통과시킨다. `drawingPolicy = .pencilOnly`만으로는
/// PKCanvasView의 UIScrollView가 손가락 hit-test까지 소비하므로 별도 처리가 필요하다.
final class PencilPassthroughCanvasView: PKCanvasView {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        guard drawingPolicy == .pencilOnly,
              let touches = event?.allTouches,
              !touches.isEmpty
        else {
            return super.hitTest(point, with: event)
        }
        // Pencil로 그리는 도중 손가락이 추가되면 event.allTouches에는 둘 다
        // 들어온다. `pencil이 하나라도 있음`으로 판단하면 손가락까지 캔버스가
        // 가로채므로, 현재 hit-test 지점에 가장 가까운 터치 하나를 판별한다.
        let nearest = touches.min { lhs, rhs in
            let left = lhs.location(in: self)
            let right = rhs.location(in: self)
            return hypot(left.x - point.x, left.y - point.y)
                < hypot(right.x - point.x, right.y - point.y)
        }
        if nearest?.type != .pencil {
            return nil
        }
        return super.hitTest(point, with: event)
    }
}

struct PencilCanvas: UIViewRepresentable {
    let canvasView: PKCanvasView

    // nil이면 애플 기본 팔레트를 쓴다.
    var tool: DrawTool?

    /// 손가락 입력 허용. 켜면 손바닥이 닿는 순간 획이 그려진다(시뮬레이터용).
    var allowFingerDrawing = false
    var isActive = true

    func makeUIView(context: Context) -> PKCanvasView {
        canvasView.drawingPolicy = allowFingerDrawing ? .anyInput : .pencilOnly
        canvasView.backgroundColor = .clear
        canvasView.isOpaque = false
        canvasView.delegate = context.coordinator
        applyTool(canvasView, context: context)
        return canvasView
    }

    func updateUIView(_ uiView: PKCanvasView, context: Context) {
        // 스냅은 새로 그린 잉크(펜/형광펜)에만. 지우개·올가미 뒤엔 안 돈다.
        context.coordinator.currentKind = tool?.kind
        uiView.drawingPolicy = allowFingerDrawing ? .anyInput : .pencilOnly
        applyTool(uiView, context: context)
    }

    private func applyTool(_ view: PKCanvasView, context: Context) {
        if let tool {
            // 도구 직접 지정, 애플 팔레트는 숨김.
            view.tool = tool.pkTool
            context.coordinator.toolPicker.setVisible(false, forFirstResponder: view)
            if isActive { view.becomeFirstResponder() }
        } else {
            // 애플 기본 팔레트.
            let picker = context.coordinator.toolPicker
            picker.setVisible(isActive, forFirstResponder: view)
            picker.addObserver(view)
            if isActive { view.becomeFirstResponder() } else { view.resignFirstResponder() }
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    // MARK: - Coordinator

    final class Coordinator: NSObject, PKCanvasViewDelegate {
        let toolPicker = PKToolPicker()
        var currentKind: PenKind?
        private var strokeCountAtToolBegin = 0
        private var strokeGeneration = 0

        func canvasViewDidBeginUsingTool(_ canvasView: PKCanvasView) {
            // PencilKit은 `DidEndUsingTool`을 호출한 시점에 마지막 획을 drawing에
            // 완전히 확정하지 않았을 수 있다. 시작 시점의 개수를 기억해 새 획만
            // 대상으로 삼고, 종료 처리는 다음 run loop에서 수행한다.
            strokeCountAtToolBegin = canvasView.drawing.strokes.count
            strokeGeneration += 1
        }

        /// 일반 펜/형광펜 획을 뗀 순간 화살표와 도형을 자동 인식해 정리한다.
        func canvasViewDidEndUsingTool(_ canvasView: PKCanvasView) {
            let baseline = strokeCountAtToolBegin
            let generation = strokeGeneration
            let kind = currentKind
            DispatchQueue.main.async { [weak self, weak canvasView] in
                guard let self, let canvasView else { return }
                guard generation == self.strokeGeneration else { return }
                guard kind == .pen || kind == .marker else { return }
                self.snapLatestStroke(in: canvasView, after: baseline)
            }
        }

        private func snapLatestStroke(in canvasView: PKCanvasView, after baseline: Int) {
            let strokes = canvasView.drawing.strokes
            // 새 획이 아직 확정되지 않았거나 도중에 취소됐다면 기존 drawing을
            // 절대 다시 대입하지 않는다. 이 guard가 후속 자유선 소실을 막는다.
            guard strokes.count > baseline, let last = strokes.last else { return }

            let points = sampledPoints(of: last)
            if let arrow = ShapeSnap.snapArrow(points) {
                replaceLastStroke(with: arrow, source: last, in: canvasView)
                return
            }

            // 흔히 그리는 방식인 `직선 한 획 + V자 화살촉 한 획`도 하나의
            // 화살표로 합친다. 첫 직선은 이미 자동 정리됐을 수 있어 2점이어도 된다.
            if strokes.count >= 2 {
                let shaft = strokes[strokes.count - 2]
                if let arrow = ShapeSnap.snapArrow(
                    shaft: sampledPoints(of: shaft),
                    head: points
                ) {
                    replaceLastTwoStrokes(with: arrow, source: last, in: canvasView)
                    return
                }
            }

            guard let snapped = ShapeSnap.snap(points) else { return }

            var updated = canvasView.drawing.strokes
            updated.removeLast()
            updated.append(makeStroke(outline: snapped.outline, like: last))
            canvasView.setDrawingUndoably(PKDrawing(strokes: updated), actionName: "도형 정리")
        }

        private func replaceLastStroke(
            with arrow: SnappedArrow,
            source: PKStroke,
            in canvasView: PKCanvasView
        ) {
            var strokes = canvasView.drawing.strokes
            strokes.removeLast()
            strokes.append(makeStroke(outline: ShapeSnap.arrow(from: arrow.from, to: arrow.to), like: source))
            canvasView.setDrawingUndoably(PKDrawing(strokes: strokes), actionName: "화살표 정리")
        }

        private func replaceLastTwoStrokes(
            with arrow: SnappedArrow,
            source: PKStroke,
            in canvasView: PKCanvasView
        ) {
            var strokes = canvasView.drawing.strokes
            strokes.removeLast(2)
            strokes.append(makeStroke(outline: ShapeSnap.arrow(from: arrow.from, to: arrow.to), like: source))
            canvasView.setDrawingUndoably(PKDrawing(strokes: strokes), actionName: "화살표 정리")
        }

        // MARK: 획 ↔ 점 변환
        /// PKStroke를 캔버스 좌표계의 점 배열로 뽑음
        private func sampledPoints(of stroke: PKStroke) -> [CGPoint] {
            stroke.path.map { $0.location.applying(stroke.transform) }
        }

        /// 원래 획의 잉크(색)와 굵기를 유지한 채 이상적 도형 획을 만듦
        private func makeStroke(outline: [CGPoint], like source: PKStroke) -> PKStroke {
            // 원본 획의 평균 굵기를 가져와 균일하게 적용
            let sizes = source.path.map { $0.size.width }
            let width = sizes.isEmpty ? 4 : sizes.reduce(0, +) / CGFloat(sizes.count)

            // PKStrokePath는 컨트롤 포인트의 시간으로 보간한다. timeOffset이 전부
            // 0이면 획이 한 점으로 뭉치거나 아예 그려지지 않는다.
            let interval = 1.0 / 240.0
            let controlPoints = outline.enumerated().map { index, point in
                PKStrokePoint(
                    location: point,
                    timeOffset: Double(index) * interval,
                    size: CGSize(width: width, height: width),
                    opacity: 1,
                    force: 1,
                    azimuth: 0,
                    altitude: .pi / 2
                )
            }
            let path = PKStrokePath(controlPoints: controlPoints, creationDate: Date())
            return PKStroke(ink: source.ink, path: path)
        }
    }
}

extension UIColor {
    convenience init(hex: String) {
        let s = hex.hasPrefix("#") ? String(hex.dropFirst()) : hex
        var value: UInt64 = 0
        Scanner(string: s).scanHexInt64(&value)
        self.init(
            red: CGFloat((value >> 16) & 0xff) / 255,
            green: CGFloat((value >> 8) & 0xff) / 255,
            blue: CGFloat(value & 0xff) / 255,
            alpha: 1
        )
    }

    var hexRGB: String {
        var red: CGFloat = 0
        var green: CGFloat = 0
        var blue: CGFloat = 0
        var alpha: CGFloat = 0
        guard getRed(&red, green: &green, blue: &blue, alpha: &alpha) else {
            return "#111111"
        }
        return String(
            format: "#%02X%02X%02X",
            Int((red * 255).rounded()),
            Int((green * 255).rounded()),
            Int((blue * 255).rounded())
        )
    }
}
