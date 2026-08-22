import SwiftUI
import UIKit

/// 두 손가락 핀치 진행 단계.
enum PinchPhase {
    case began, changed, ended
}

/// 핀치 배율 상태. `DrawingCanvas`의 `onPinch`를 그대로 흘려 넣으면 된다.
/// 라이브 프리뷰와 연습장이 같이 쓴다.
struct PinchZoom {
    private(set) var scale: CGFloat = 1
    private(set) var anchor: UnitPoint = .center
    private var base: CGFloat = 1

    mutating func apply(
        _ phase: PinchPhase, _ gestureScale: CGFloat, focus: CGPoint, in size: CGSize
    ) {
        switch phase {
        case .began:
            base = scale
            // 이미 확대된 상태에서 기준점을 새로 잡으면 화면이 튄다. 원배율일 때만 잡는다.
            if scale == 1, size.width > 0, size.height > 0 {
                anchor = UnitPoint(x: focus.x / size.width, y: focus.y / size.height)
            }
        case .changed:
            scale = min(6, max(1, base * gestureScale))
        case .ended:
            if scale < 1.02 { scale = 1 }
        }
    }
}

/// 직접 구현한 필기 캔버스.
/// 스타일러스 필압·팜 리젝션·지우개 2모드·올가미 선택/이동/크기조절 지원.
struct DrawingCanvas: UIViewRepresentable {
    @ObservedObject var controller: DrawingController

    /// 손가락 입력 허용(시뮬레이터·개발용). 끄면 애플펜슬만 받는다.
    var allowFingerDrawing = false

    /// 두 손가락 핀치. 배율과 캔버스 안의 초점을 넘겨 상위 뷰가 확대에 쓴다.
    var onPinch: ((PinchPhase, CGFloat, CGPoint) -> Void)?

    func makeUIView(context: Context) -> DrawingCanvasView {
        let view = DrawingCanvasView()
        view.backgroundColor = .clear
        view.isOpaque = false
        view.isMultipleTouchEnabled = true
        apply(to: view)
        return view
    }

    func updateUIView(_ view: DrawingCanvasView, context: Context) {
        apply(to: view)
        // 컨트롤러가 바뀌면 SwiftUI가 여기로 다시 들어온다 — 그때 다시 그린다.
        view.setNeedsDisplay()
    }

    private func apply(to view: DrawingCanvasView) {
        view.controller = controller
        view.allowFingerDrawing = allowFingerDrawing
        view.onPinch = onPinch
    }
}

final class DrawingCanvasView: UIView {
    var controller: DrawingController?
    var allowFingerDrawing = false
    var onPinch: ((PinchPhase, CGFloat, CGPoint) -> Void)?

    private enum Gesture { case none, draw, erase, lasso, move, resize }

    private var gesture: Gesture = .none
    private var activeTouch: UITouch?
    private var current: [StrokePoint] = []
    private var lassoPoints: [CGPoint] = []
    private var eraserAt: CGPoint?
    private var erasedSomething = false

    // 이동/크기조절 시작 시점 상태.
    private var base: [Stroke]?
    private var baseBounds: CGRect = .zero
    private var origin: CGPoint = .zero
    private var handle = -1

    private static let accent = UIColor(hex: "#2f6bff")

    private var tool: DrawTool { controller?.tool ?? DrawTool() }

    override init(frame: CGRect) {
        super.init(frame: frame)
        addGestureRecognizer(
            UIPinchGestureRecognizer(target: self, action: #selector(handlePinch))
        )
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("스토리보드에서 만들지 않는다") }

    // MARK: - 입력 판정

    private func accepts(_ touch: UITouch) -> Bool {
        if touch.type == .pencil { return true }
        // 팜 리젝션: 손가락은 옵션이 켜졌을 때만.
        return allowFingerDrawing && (touch.type == .direct || touch.type == .indirectPointer)
    }

    /// 필압 0~1. 필압을 못 재는 입력(손가락 등)은 1로 본다.
    private func pressure(of touch: UITouch) -> CGFloat {
        guard touch.maximumPossibleForce > 0 else { return 1 }
        return max(0, min(1, touch.force / touch.maximumPossibleForce))
    }

    // MARK: - 터치 라우팅

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first, accepts(touch) else { return }
        if activeTouch != nil {
            // 두 번째 손가락 → 진행 중인 제스처를 버리고 줌에 양보.
            cancelGesture()
            return
        }
        activeTouch = touch
        let point = touch.location(in: self)
        switch tool.kind {
        case .eraser:
            gesture = .erase
            erasedSomething = false
            erase(at: point)
        case .lasso:
            beginLasso(at: point)
        case .pen, .marker:
            gesture = .draw
            current.append(StrokePoint(location: point, pressure: pressure(of: touch)))
        }
        setNeedsDisplay()
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = activeTouch, touches.contains(touch) else { return }
        let point = touch.location(in: self)
        switch gesture {
        case .draw:
            // 펜슬은 화면 주사율보다 빠르게 표본을 만든다. 뭉쳐 온 표본까지 다 받아야
            // 획이 각지지 않는다.
            for sample in event?.coalescedTouches(for: touch) ?? [touch] {
                current.append(StrokePoint(
                    location: sample.location(in: self), pressure: pressure(of: sample)
                ))
            }
        case .erase:
            erase(at: point)
        case .lasso:
            lassoPoints.append(point)
        case .move:
            applyMove(to: point)
        case .resize:
            applyResize(to: point)
        case .none:
            return
        }
        setNeedsDisplay()
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = activeTouch, touches.contains(touch) else { return }
        activeTouch = nil
        switch gesture {
        case .draw:
            finishStroke()
        case .erase:
            eraserAt = nil
            erasedSomething = false
        case .lasso:
            controller?.setSelection(
                Lasso.strokesInside(controller?.strokes ?? [], polygon: lassoPoints)
            )
            lassoPoints = []
        case .move, .resize:
            if let base { controller?.commitFrom(base) }
            base = nil
        case .none:
            break
        }
        gesture = .none
        setNeedsDisplay()
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = activeTouch, touches.contains(touch) else { return }
        cancelGesture()
    }

    /// 진행 중인 제스처를 되돌린다. undo 스택은 건드리지 않는다.
    private func cancelGesture() {
        if gesture == .move || gesture == .resize, let base {
            controller?.setStrokes(base)
        }
        current = []
        lassoPoints = []
        base = nil
        eraserAt = nil
        gesture = .none
        activeTouch = nil
        setNeedsDisplay()
    }

    // MARK: - 그리기

    private func finishStroke() {
        let points = current
        current = []
        guard points.count >= 2, let controller else { return }

        var stroke = Stroke(
            kind: tool.kind, color: tool.color, width: tool.width, points: points
        )
        // 도형·화살표 자동 인식은 항상 켜져 있다.
        if let snapped = ShapeSnap.snap(points.map(\.location)) {
            stroke.points = snapped.outline.map { StrokePoint(location: $0, pressure: 1) }
        }

        controller.pushSnapshot()
        controller.setStrokes(controller.strokes + [stroke])
    }

    // MARK: - 지우개

    private func erase(at point: CGPoint) {
        guard let controller else { return }
        eraserAt = point
        let result = Eraser.erase(
            controller.strokes,
            at: point,
            radius: tool.eraserWidth / 2,
            mode: tool.eraserMode
        )
        guard result.changed else { return }
        if !erasedSomething {
            erasedSomething = true
            controller.pushSnapshot()
        }
        controller.clearSelection()
        controller.setStrokes(result.strokes)
    }

    // MARK: - 올가미: 선택/이동/크기조절

    private func beginLasso(at point: CGPoint) {
        if let bounds = selectionBounds() {
            let hit = hitHandle(bounds, point)
            if hit >= 0 {
                gesture = .resize
                handle = hit
                startTransform(bounds, point)
                return
            }
            if bounds.contains(point) {
                gesture = .move
                startTransform(bounds, point)
                return
            }
        }
        gesture = .lasso
        controller?.clearSelection()
        lassoPoints = [point]
    }

    private func startTransform(_ bounds: CGRect, _ point: CGPoint) {
        base = controller?.strokes
        baseBounds = bounds
        origin = point
    }

    private func applyMove(to point: CGPoint) {
        guard let base, let controller else { return }
        let dx = point.x - origin.x, dy = point.y - origin.y
        var next = base
        for i in controller.selection where next.indices.contains(i) {
            next[i].points = next[i].points.map {
                StrokePoint(
                    location: CGPoint(x: $0.location.x + dx, y: $0.location.y + dy),
                    pressure: $0.pressure
                )
            }
        }
        controller.setStrokes(next)
    }

    private func applyResize(to point: CGPoint) {
        guard let base, let controller else { return }
        let box = corners(of: baseBounds)
        let moving = box[handle]
        let fixed = box[(handle + 2) % 4] // 반대편 꼭짓점 고정
        let dx = moving.x - fixed.x, dy = moving.y - fixed.y
        let sx = dx == 0 ? 1 : max(0.05, min(20, (point.x - fixed.x) / dx))
        let sy = dy == 0 ? 1 : max(0.05, min(20, (point.y - fixed.y) / dy))
        var next = base
        for i in controller.selection where next.indices.contains(i) {
            next[i].points = next[i].points.map {
                StrokePoint(
                    location: CGPoint(
                        x: fixed.x + ($0.location.x - fixed.x) * sx,
                        y: fixed.y + ($0.location.y - fixed.y) * sy
                    ),
                    pressure: $0.pressure
                )
            }
        }
        controller.setStrokes(next)
    }

    private func selectionBounds() -> CGRect? {
        guard let controller, !controller.selection.isEmpty else { return nil }
        var minX = CGFloat.greatestFiniteMagnitude, minY = CGFloat.greatestFiniteMagnitude
        var maxX = -CGFloat.greatestFiniteMagnitude, maxY = -CGFloat.greatestFiniteMagnitude
        for i in controller.selection where controller.strokes.indices.contains(i) {
            for p in controller.strokes[i].points {
                minX = min(minX, p.location.x); minY = min(minY, p.location.y)
                maxX = max(maxX, p.location.x); maxY = max(maxY, p.location.y)
            }
        }
        guard minX <= maxX, minY <= maxY else { return nil }
        return CGRect(x: minX, y: minY, width: maxX - minX, height: maxY - minY)
            .insetBy(dx: -14, dy: -14)
    }

    private func corners(of rect: CGRect) -> [CGPoint] {
        [
            CGPoint(x: rect.minX, y: rect.minY), CGPoint(x: rect.maxX, y: rect.minY),
            CGPoint(x: rect.maxX, y: rect.maxY), CGPoint(x: rect.minX, y: rect.maxY),
        ]
    }

    private func hitHandle(_ bounds: CGRect, _ point: CGPoint) -> Int {
        let box = corners(of: bounds)
        for i in 0..<4 where hypot(point.x - box[i].x, point.y - box[i].y) <= 18 {
            return i
        }
        return -1
    }

    // MARK: - 줌

    @objc private func handlePinch(_ recognizer: UIPinchGestureRecognizer) {
        let focus = recognizer.location(in: self)
        switch recognizer.state {
        case .began:
            onPinch?(.began, recognizer.scale, focus)
        case .changed:
            onPinch?(.changed, recognizer.scale, focus)
        case .ended, .cancelled, .failed:
            onPinch?(.ended, recognizer.scale, focus)
        default:
            break
        }
    }

    // MARK: - 렌더

    override func draw(_ rect: CGRect) {
        guard let context = UIGraphicsGetCurrentContext(), let controller else { return }

        StrokeRenderer.draw(controller.strokes, in: context)
        if !current.isEmpty {
            StrokeRenderer.draw(
                kind: tool.kind, color: tool.color, width: tool.width,
                points: current, in: context
            )
        }

        if let eraserAt {
            // 지우개 위치 표시.
            context.setLineDash(phase: 0, lengths: [])
            context.setStrokeColor(UIColor(white: 0.53, alpha: 0.53).cgColor)
            context.setLineWidth(1)
            context.strokeEllipse(in: CGRect(
                x: eraserAt.x - tool.eraserWidth / 2,
                y: eraserAt.y - tool.eraserWidth / 2,
                width: tool.eraserWidth,
                height: tool.eraserWidth
            ))
        }

        guard tool.kind == .lasso else { return }

        context.setStrokeColor(Self.accent.cgColor)
        context.setLineWidth(1.5)
        context.setLineDash(phase: 0, lengths: [6, 5])

        if lassoPoints.count >= 2 {
            context.beginPath()
            context.move(to: lassoPoints[0])
            for p in lassoPoints.dropFirst() { context.addLine(to: p) }
            context.strokePath()
        }

        if let box = selectionBounds() {
            context.stroke(box)
            // 모서리 크기조절 핸들.
            context.setLineDash(phase: 0, lengths: [])
            for corner in corners(of: box) {
                let dot = CGRect(x: corner.x - 6, y: corner.y - 6, width: 12, height: 12)
                context.setFillColor(UIColor.white.cgColor)
                context.fillEllipse(in: dot)
                context.strokeEllipse(in: dot)
            }
        }
    }
}
