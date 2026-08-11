import PencilKit
import SwiftUI

// 올가미로 획을 골라 이동·크기조절·삭제한다.
// PencilKit 기본 올가미는 무엇이 선택됐는지 못 알려줘서 직접 만든다.
struct SelectionOverlay: View {
    let canvasView: PKCanvasView
    @Binding var selection: Set<Int>

    @State private var lasso: [CGPoint] = []
    @State private var mode: Mode = .idle
    @State private var start: CGPoint = .zero
    @State private var baseStrokes: [PKStroke] = []
    @State private var resizeOrig: CGPoint = .zero
    @State private var resizeAnchor: CGPoint = .zero
    @State private var tick = 0

    private enum Mode { case idle, lasso, move, resize }
    private let minExtent: CGFloat = 20

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

                ForEach(0..<4, id: \.self) { i in
                    Circle()
                        .fill(Color.white)
                        .overlay(Circle().stroke(Color.accentColor, lineWidth: 2))
                        .frame(width: 16, height: 16)
                        .position(x: corners(box)[i].x, y: corners(box)[i].y)
                }

                Button(role: .destructive, action: deleteSelection) {
                    Image(systemName: "trash.fill")
                        .padding(7)
                        .background(.thinMaterial, in: Circle())
                }
                .position(x: box.maxX, y: box.minY - 22)
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

    // MARK: 제스처

    private var drag: some Gesture {
        DragGesture(minimumDistance: 2)
            .onChanged { value in
                if mode == .idle { begin(at: value.startLocation) }
                switch mode {
                case .lasso:
                    lasso.append(value.location)
                case .move:
                    applyTransform(CGAffineTransform(
                        translationX: value.location.x - start.x,
                        y: value.location.y - start.y
                    ))
                    tick += 1
                case .resize:
                    resize(to: value.location)
                    tick += 1
                case .idle:
                    break
                }
            }
            .onEnded { _ in
                switch mode {
                case .lasso:
                    selection = strokesInside(lasso)
                    lasso = []
                case .move:
                    commit(actionName: "이동")
                case .resize:
                    commit(actionName: "크기 조절")
                case .idle:
                    break
                }
                mode = .idle
            }
    }

    private func begin(at point: CGPoint) {
        start = point
        if !selection.isEmpty, let box = boxRect {
            if let hit = hitCorner(point, box: box) {
                mode = .resize
                resizeOrig = hit.corner
                resizeAnchor = hit.anchor
                baseStrokes = canvasView.drawing.strokes
                return
            }
            if box.insetBy(dx: -12, dy: -12).contains(point) {
                mode = .move
                baseStrokes = canvasView.drawing.strokes
                return
            }
        }
        mode = .lasso
        selection = []
        lasso = [point]
    }

    // MARK: 선택 박스 · 핸들

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

    private func corners(_ box: CGRect) -> [CGPoint] {
        [
            CGPoint(x: box.minX, y: box.minY), CGPoint(x: box.maxX, y: box.minY),
            CGPoint(x: box.maxX, y: box.maxY), CGPoint(x: box.minX, y: box.maxY),
        ]
    }

    /// 잡은 모서리와 그 반대편(고정점)을 돌려준다.
    private func hitCorner(_ p: CGPoint, box: CGRect) -> (corner: CGPoint, anchor: CGPoint)? {
        let pairs: [(CGPoint, CGPoint)] = [
            (CGPoint(x: box.minX, y: box.minY), CGPoint(x: box.maxX, y: box.maxY)),
            (CGPoint(x: box.maxX, y: box.minY), CGPoint(x: box.minX, y: box.maxY)),
            (CGPoint(x: box.maxX, y: box.maxY), CGPoint(x: box.minX, y: box.minY)),
            (CGPoint(x: box.minX, y: box.maxY), CGPoint(x: box.maxX, y: box.minY)),
        ]
        for (corner, anchor) in pairs where hypot(p.x - corner.x, p.y - corner.y) < 26 {
            return (corner, anchor)
        }
        return nil
    }

    // MARK: 변형

    private func resize(to p: CGPoint) {
        let ax = resizeAnchor.x, ay = resizeAnchor.y
        let refX = resizeOrig.x - ax, refY = resizeOrig.y - ay
        guard refX != 0, refY != 0 else { return }
        let nx = clamp(p.x, anchor: ax, ref: refX)
        let ny = clamp(p.y, anchor: ay, ref: refY)
        let m = CGAffineTransform(translationX: ax, y: ay)
            .scaledBy(x: (nx - ax) / refX, y: (ny - ay) / refY)
            .translatedBy(x: -ax, y: -ay)
        applyTransform(m)
    }

    /// 고정점에서 최소 크기 아래로는 줄지 않고, 반대편으로 뒤집히지도 않게 막는다.
    private func clamp(_ v: CGFloat, anchor a: CGFloat, ref: CGFloat) -> CGFloat {
        let dir: CGFloat = ref >= 0 ? 1 : -1
        var d = v - a
        if d * dir < minExtent { d = dir * minExtent }
        return a + d
    }

    private func applyTransform(_ m: CGAffineTransform) {
        var strokes = baseStrokes
        for i in selection where strokes.indices.contains(i) {
            let s = strokes[i]
            strokes[i] = PKStroke(
                ink: s.ink, path: s.path, transform: s.transform.concatenating(m), mask: s.mask
            )
        }
        canvasView.drawing = PKDrawing(strokes: strokes)
    }

    private func commit(actionName: String) {
        let changed = canvasView.drawing
        canvasView.drawing = PKDrawing(strokes: baseStrokes) // 변형 전으로 되돌린 뒤
        canvasView.setDrawingUndoably(changed, actionName: actionName)
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
