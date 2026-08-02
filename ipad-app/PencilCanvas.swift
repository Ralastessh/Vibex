import PencilKit
import SwiftUI

struct PencilCanvas: UIViewRepresentable {
    let canvasView: PKCanvasView

    /// 도형 스냅 on/off.
    @Binding var shapeSnapEnabled: Bool

    func makeUIView(context: Context) -> PKCanvasView {
        // 팜 리젝션: Pencil로만 그린다.
        canvasView.drawingPolicy = .pencilOnly
        canvasView.backgroundColor = .clear
        canvasView.isOpaque = false
        canvasView.delegate = context.coordinator

        // 도구 피커(색·굵기·도구) 띄우기
        let picker = context.coordinator.toolPicker
        DispatchQueue.main.async {
            picker.setVisible(true, forFirstResponder: canvasView)
            picker.addObserver(canvasView)
            canvasView.becomeFirstResponder()
        }
        return canvasView
    }

    func updateUIView(_ uiView: PKCanvasView, context: Context) {
        context.coordinator.shapeSnapEnabled = shapeSnapEnabled
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

        /// 획을 뗀 순간. 도형 모드면 방금 그린 획을 인식해 스냅한다.
        func canvasViewDidEndUsingTool(_ canvasView: PKCanvasView) {
            guard shapeSnapEnabled else { return }
            guard let last = canvasView.drawing.strokes.last else { return }

            let points = sampledPoints(of: last)
            guard let snapped = ShapeSnap.snap(points) else { return }

            let ideal = makeStroke(outline: snapped.outline, like: last)
            var strokes = canvasView.drawing.strokes
            strokes.removeLast()
            strokes.append(ideal)

            // undo 스택에 남게 등록 경로로 바꾼다(직접 대입은 안 남음).
            canvasView.setDrawingUndoable(PKDrawing(strokes: strokes))
        }

        // MARK: 획 ↔ 점 변환

        /// PKStroke를 캔버스 좌표계의 점 배열로 뽑는다.
        private func sampledPoints(of stroke: PKStroke) -> [CGPoint] {
            stroke.path.map { $0.location.applying(stroke.transform) }
        }

        // 원래 획의 색·굵기를 유지한 도형 획을 만든다.
        private func makeStroke(outline: [CGPoint], like source: PKStroke) -> PKStroke {
            let sizes = source.path.map { $0.size.width }
            let width = sizes.isEmpty ? 4 : sizes.reduce(0, +) / CGFloat(sizes.count)

            // timeOffset은 점마다 증가시켜야 한다(전부 0이면 안 그려짐).
            let controlPoints = outline.enumerated().map { index, point in
                PKStrokePoint(
                    location: point,
                    timeOffset: Double(index) * 0.01,
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

extension PKCanvasView {
    // drawing을 undo 스택에 남기며 바꾼다(직접 대입은 안 남음). redo도 된다.
    func setDrawingUndoable(_ newDrawing: PKDrawing) {
        let previous = drawing
        undoManager?.registerUndo(withTarget: self) { canvas in
            canvas.setDrawingUndoable(previous)
        }
        drawing = newDrawing
    }
}
