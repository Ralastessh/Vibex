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

struct PencilCanvas: UIViewRepresentable {
    let canvasView: PKCanvasView

    /// 도형 스냅 on/off.
    @Binding var shapeSnapEnabled: Bool

    /// 손가락 입력 허용. 기본값은 꺼짐 — 켜면 손바닥이 닿는 순간 획이 그려진다.
    /// 펜슬이 없는 시뮬레이터에서 시험할 때만 켠다.
    var allowFingerDrawing = false
    var isActive = true

    func makeUIView(context: Context) -> PKCanvasView {
        // 팜 리젝션은 펜만 받는 것으로 얻는다.
        canvasView.drawingPolicy = allowFingerDrawing ? .anyInput : .pencilOnly
        canvasView.backgroundColor = .clear
        canvasView.isOpaque = false
        canvasView.delegate = context.coordinator

        // 도구 피커(색·굵기·도구) 띄우기
        let picker = context.coordinator.toolPicker
        DispatchQueue.main.async {
            picker.setVisible(isActive, forFirstResponder: canvasView)
            picker.addObserver(canvasView)
            if isActive { canvasView.becomeFirstResponder() }
        }
        return canvasView
    }

    func updateUIView(_ uiView: PKCanvasView, context: Context) {
        context.coordinator.shapeSnapEnabled = shapeSnapEnabled
        uiView.drawingPolicy = allowFingerDrawing ? .anyInput : .pencilOnly
        context.coordinator.toolPicker.setVisible(isActive, forFirstResponder: uiView)
        if isActive {
            uiView.becomeFirstResponder()
        } else {
            uiView.resignFirstResponder()
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(shapeSnapEnabled: shapeSnapEnabled)
    }

    // MARK: - Coordinator

    final class Coordinator: NSObject, PKCanvasViewDelegate {
        let toolPicker = PKToolPicker()
        var shapeSnapEnabled: Bool

        init(shapeSnapEnabled: Bool) {
            self.shapeSnapEnabled = shapeSnapEnabled
        }

        /// 획을 뗀 순간. 도형 모드면 방금 그린 획을 인식해 스냅
        func canvasViewDidEndUsingTool(_ canvasView: PKCanvasView) {
            guard shapeSnapEnabled else { return }
            guard let last = canvasView.drawing.strokes.last else { return }

            let points = sampledPoints(of: last)
            guard let snapped = ShapeSnap.snap(points) else { return }

            var strokes = canvasView.drawing.strokes
            strokes.removeLast()
            strokes.append(makeStroke(outline: snapped.outline, like: last))
            canvasView.setDrawingUndoably(PKDrawing(strokes: strokes), actionName: "도형 정리")
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
