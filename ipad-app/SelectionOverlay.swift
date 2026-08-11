import PencilKit
import SwiftUI

// 올가미로 획을 골라 이동·삭제한다.
// PencilKit 기본 올가미는 무엇이 선택됐는지 못 알려줘서 직접 만든다.
struct SelectionOverlay: View {
    let canvasView: PKCanvasView
    @Binding var selection: Set<Int>

    @State private var lasso: [CGPoint] = []
    @State private var mode: Mode = .idle
    @State private var start: CGPoint = .zero
    @State private var baseStrokes: [PKStroke] = []
    @State private var tick = 0

    private enum Mode { case idle, lasso, move }

    var body: some View {
        ZStack {
            Color.clear.contentShape(Rectangle())

            if lasso.count > 1 {
                lassoPath.fill(Color.accentColor.opacity(0.08))
                lassoPath.stroke(Color.accentColor, style: StrokeStyle(lineWidth: 1.5, dash: [6]))
            }

            if let box = boxRect {
                Rectangle()
                    .strokeBorder(Color.accentColor, style: StrokeStyle(lineWidth: 1.5, dash: [5]))
                    .frame(width: box.width, height: box.height)
                    .position(x: box.midX, y: box.midY)

                Button(role: .destructive, action: deleteSelection) {
                    Image(systemName: "trash.fill")
                        .padding(7)
                        .background(.thinMaterial, in: Circle())
                }
                .position(x: box.maxX, y: box.minY - 6)
            }
        }
        .gesture(drag)
    }

    private var lassoPath: Path {
        Path { p in
            guard let first = lasso.first else { return }
            p.move(to: first)
            for pt in lasso.dropFirst() { p.addLine(to: pt) }
            p.closeSubpath()
        }
    }

    private var drag: some Gesture {
        DragGesture(minimumDistance: 2)
            .onChanged { value in
                if mode == .idle {
                    start = value.startLocation
                    if !selection.isEmpty,
                       let box = boxRect, box.insetBy(dx: -12, dy: -12).contains(start) {
                        mode = .move
                        baseStrokes = canvasView.drawing.strokes
                    } else {
                        mode = .lasso
                        selection = []
                        lasso = [start]
                    }
                }
                switch mode {
                case .lasso:
                    lasso.append(value.location)
                case .move:
                    applyMove(dx: value.location.x - start.x, dy: value.location.y - start.y)
                    tick += 1
                case .idle:
                    break
                }
            }
            .onEnded { _ in
                if mode == .lasso {
                    selection = strokesInside(lasso)
                    lasso = []
                } else if mode == .move {
                    commitMove()
                }
                mode = .idle
            }
    }

    // MARK: 선택 박스

    private var boxRect: CGRect? {
        _ = tick
        guard !selection.isEmpty else { return nil }
        let strokes = canvasView.drawing.strokes
        var points: [CGPoint] = []
        for i in selection where strokes.indices.contains(i) {
            points += strokes[i].path.map { $0.location.applying(strokes[i].transform) }
        }
        guard let minX = points.map(\.x).min(), let minY = points.map(\.y).min(),
              let maxX = points.map(\.x).max(), let maxY = points.map(\.y).max() else { return nil }
        return CGRect(x: minX, y: minY, width: maxX - minX, height: maxY - minY)
    }

    // MARK: 동작

    private func applyMove(dx: CGFloat, dy: CGFloat) {
        let t = CGAffineTransform(translationX: dx, y: dy)
        var strokes = baseStrokes
        for i in selection where strokes.indices.contains(i) {
            let s = strokes[i]
            strokes[i] = PKStroke(
                ink: s.ink, path: s.path, transform: s.transform.concatenating(t), mask: s.mask
            )
        }
        canvasView.drawing = PKDrawing(strokes: strokes)
    }

    private func commitMove() {
        let moved = canvasView.drawing
        canvasView.drawing = PKDrawing(strokes: baseStrokes) // 이동 전으로 되돌린 뒤
        canvasView.setDrawingUndoably(moved, actionName: "이동")
    }

    private func deleteSelection() {
        let kept = canvasView.drawing.strokes.enumerated()
            .filter { !selection.contains($0.offset) }
            .map(\.element)
        canvasView.setDrawingUndoably(PKDrawing(strokes: kept), actionName: "삭제")
        selection = []
    }

    // MARK: 올가미 판정

    private func strokesInside(_ polygon: [CGPoint]) -> Set<Int> {
        guard polygon.count > 2 else { return [] }
        var result: Set<Int> = []
        for (i, s) in canvasView.drawing.strokes.enumerated() {
            let points = s.path.map { $0.location.applying(s.transform) }
            if points.contains(where: { pointInPolygon($0, polygon) }) { result.insert(i) }
        }
        return result
    }

    private func pointInPolygon(_ p: CGPoint, _ poly: [CGPoint]) -> Bool {
        var inside = false
        var j = poly.count - 1
        for i in 0..<poly.count {
            let a = poly[i], b = poly[j]
            if (a.y > p.y) != (b.y > p.y),
               p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x {
                inside.toggle()
            }
            j = i
        }
        return inside
    }
}
