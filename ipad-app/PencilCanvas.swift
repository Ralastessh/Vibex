import PencilKit
import SwiftUI
struct PencilCanvas: UIViewRepresentable {
    let canvasView: PKCanvasView

    /// 도형 스냅 on/off.
    @Binding var shapeSnapEnabled: Bool

    func makeUIView(context: Context) -> PKCanvasView {
        canvasView.drawingPolicy = .anyInput // 펜·손가락 모두 허용
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
        private var isSnapping = false

        init(shapeSnapEnabled: Bool) {
            self.shapeSnapEnabled = shapeSnapEnabled
        }

        /// 획을 뗀 순간. 도형 모드면 방금 그린 획을 인식해 스냅
        func canvasViewDidEndUsingTool(_ canvasView: PKCanvasView) {
            guard shapeSnapEnabled, !isSnapping else { return }
            guard let last = canvasView.drawing.strokes.last else { return }

            let points = sampledPoints(of: last)
            guard let snapped = ShapeSnap.snap(points) else { return }

            let ideal = makeStroke(outline: snapped.outline, like: last)
            var strokes = canvasView.drawing.strokes
            strokes.removeLast()
            strokes.append(ideal)

            isSnapping = true
            canvasView.drawing = PKDrawing(strokes: strokes)
            isSnapping = false
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

            let controlPoints = outline.map { point in
                PKStrokePoint(
                    location: point,
                    timeOffset: 0,
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
