// PencilKit 캔버스와 웹 미리보기를 함께 사용할 수 있도록 입력을 나눠 처리
import PencilKit
import SwiftUI
import WebKit

extension PKCanvasView {
    func setDrawingUndoably(_ newDrawing: PKDrawing, actionName: String) {
        let previous = drawing
        undoManager?.registerUndo(withTarget: self) { target in
            target.setDrawingUndoably(previous, actionName: actionName)
        }
        undoManager?.setActionName(actionName)
        drawing = newDrawing
    }
}

enum PenKind: String, CaseIterable {
    case pen, marker, eraser, lasso
    var usesColor: Bool { self == .pen || self == .marker }
}

enum EraserMode: Equatable {
    case pixel   // 닿은 픽셀만 지움 -> 획 일부가 남음
    case object  // 닿은 획 전체를 지움
}

struct DrawTool: Equatable {
    static let palette = ["#111111", "#2f6bff", "#e0564a", "#1f9d55", "#f59e0b", "#8b5cf6"]

    var kind: PenKind = .pen
    var colorHex: String = "#111111"
    var width: CGFloat = 5
    var eraserWidth: CGFloat = 24
    var eraserMode: EraserMode = .pixel

    var pkTool: PKTool {
        let color = UIColor(hex: colorHex)
        switch kind {
        case .pen: return PKInkingTool(.pen, color: color, width: width)
        case .marker: return PKInkingTool(.marker, color: color, width: max(width * 3, 16))
        case .eraser:
            // width 지정 지우개와 vector 지우개는
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

private final class PencilStrokeGestureRecognizer: UIGestureRecognizer,
    UIGestureRecognizerDelegate
{
    weak var canvasView: PencilPassthroughCanvasView?
    weak var webView: WKWebView?
    weak var pencilCoordinator: PencilCanvas.Coordinator?
    var tool = DrawTool()

    private var originalDrawing = PKDrawing()
    private var activePoints: [PKStrokePoint] = []
    private var startedAt: TimeInterval = 0
    private var changedDrawing = false
    private(set) var pencilIsActive = false
    private(set) var fingerIsActive = false
    private var lockedContentOffset: CGPoint = .zero
    private var lockedZoomScale: CGFloat = 1

    init(
        canvasView: PencilPassthroughCanvasView,
        webView: WKWebView,
        coordinator: PencilCanvas.Coordinator
    ) {
        self.canvasView = canvasView
        self.webView = webView
        self.pencilCoordinator = coordinator
        super.init(target: nil, action: nil)
        delegate = self
        allowedTouchTypes = [NSNumber(value: UITouch.TouchType.pencil.rawValue)]
        requiresExclusiveTouchType = false
        cancelsTouchesInView = true
        delaysTouchesBegan = false
        delaysTouchesEnded = false
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
        guard let touch = touches.first(where: { $0.type == .pencil }),
              let canvasView else {
            state = .failed
            return
        }

        originalDrawing = canvasView.drawing
        activePoints.removeAll(keepingCapacity: true)
        startedAt = touch.timestamp
        changedDrawing = false
        pencilIsActive = true
        lockWebNavigationAtCurrentPosition()
        state = .began
        consume(touch: touch, event: event)

        #if DEBUG
        print("[VibexInput] pencil began; webPan=\(webView?.scrollView.panGestureRecognizer.state.rawValue ?? -1)")
        #endif
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) {
        guard let touch = touches.first(where: { $0.type == .pencil }) else { return }
        consume(touch: touch, event: event)
        state = .changed
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
        if let touch = touches.first(where: { $0.type == .pencil }) {
            consume(touch: touch, event: event)
        }
        commitDrawing()
        pencilIsActive = false
        state = .ended

        #if DEBUG
        print("[VibexInput] pencil ended; points=\(activePoints.count)")
        #endif
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {
        if let canvasView {
            canvasView.drawing = originalDrawing
            canvasView.refreshDrawingMirror()
        }
        pencilIsActive = false
        state = .cancelled
    }

    override func reset() {
        activePoints.removeAll(keepingCapacity: false)
        originalDrawing = PKDrawing()
        changedDrawing = false
        pencilIsActive = false
        super.reset()
    }

    /// 손가락 접촉 여부는 WebView의 pan 상태만으로 판별할 수 없음. 펜슬도 같은 pan recognizer를 깨울 수 있기 때문에 별도 direct-touch monitor로 판단
    func setFingerActive(_ active: Bool) {
        guard fingerIsActive != active else { return }
        fingerIsActive = active
        if pencilIsActive {
            // 손가락을 떼는 순간의 위치를 새 기준으로 잡음. 따라서 Pencil을 계속 대고 있어도 손가락으로 이동한 결과 보존
            lockWebNavigationAtCurrentPosition()
        }
    }

    @discardableResult
    func restoreWebNavigationIfPencilOnly() -> Bool {
        guard pencilIsActive, !fingerIsActive, let scrollView = webView?.scrollView else {
            return false
        }

        var restored = false
        if abs(scrollView.zoomScale - lockedZoomScale) > 0.0001 {
            scrollView.setZoomScale(lockedZoomScale, animated: false)
            restored = true
        }
        if abs(scrollView.contentOffset.x - lockedContentOffset.x) > 0.1
            || abs(scrollView.contentOffset.y - lockedContentOffset.y) > 0.1
        {
            scrollView.setContentOffset(lockedContentOffset, animated: false)
            restored = true
        }
        return restored
    }

    private func lockWebNavigationAtCurrentPosition() {
        guard let scrollView = webView?.scrollView else { return }
        lockedContentOffset = scrollView.contentOffset
        lockedZoomScale = scrollView.zoomScale
    }

    func gestureRecognizer(
        _ gestureRecognizer: UIGestureRecognizer,
        shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
    ) -> Bool {
        true
    }

    override func canPrevent(_ preventedGestureRecognizer: UIGestureRecognizer) -> Bool {
        false
    }

    override func canBePrevented(by preventingGestureRecognizer: UIGestureRecognizer) -> Bool {
        false
    }

    private func consume(touch: UITouch, event: UIEvent) {
        let samples = event.coalescedTouches(for: touch) ?? [touch]
        switch tool.kind {
        case .pen, .marker:
            appendInkSamples(samples)
        case .eraser:
            samples.forEach { erase(at: documentPoint(for: $0)) }
        case .lasso:
            break
        }
        restoreWebNavigationIfPencilOnly()
    }

    private func appendInkSamples(_ samples: [UITouch]) {
        guard let canvasView else { return }
        let width = tool.kind == .marker ? max(tool.width * 3, 16) : tool.width

        for sample in samples {
            let timeOffset = max(0, sample.timestamp - startedAt)
            if let last = activePoints.last,
               timeOffset <= last.timeOffset,
               hypot(
                   last.location.x - documentPoint(for: sample).x,
                   last.location.y - documentPoint(for: sample).y
               ) < 0.05 {
                continue
            }

            let maximumForce = max(sample.maximumPossibleForce, 0.001)
            let normalizedForce = max(0.05, min(1, sample.force / maximumForce))
            activePoints.append(
                PKStrokePoint(
                    location: documentPoint(for: sample),
                    timeOffset: timeOffset,
                    size: CGSize(width: width, height: width),
                    opacity: 1,
                    force: normalizedForce,
                    azimuth: sample.azimuthAngle(in: canvasView),
                    altitude: sample.altitudeAngle
                )
            )
        }

        guard !activePoints.isEmpty else { return }
        let inkType: PKInk.InkType = tool.kind == .marker ? .marker : .pen
        let path = PKStrokePath(controlPoints: activePoints, creationDate: Date())
        let stroke = PKStroke(
            ink: PKInk(inkType, color: UIColor(hex: tool.colorHex)),
            path: path
        )
        canvasView.drawing = PKDrawing(strokes: originalDrawing.strokes + [stroke])
        canvasView.refreshDrawingMirror()
        changedDrawing = true
    }

    private func erase(at point: CGPoint) {
        guard let canvasView else { return }
        let radius = max(4, tool.eraserWidth / 2)
        let kept = canvasView.drawing.strokes.filter { stroke in
            !stroke.renderBounds.insetBy(dx: -radius, dy: -radius).contains(point)
        }
        guard kept.count != canvasView.drawing.strokes.count else { return }
        canvasView.drawing = PKDrawing(strokes: kept)
        canvasView.refreshDrawingMirror()
        changedDrawing = true
    }

    private func commitDrawing() {
        guard changedDrawing, let canvasView else { return }
        let changed = canvasView.drawing
        let baseline = originalDrawing.strokes.count
        canvasView.drawing = originalDrawing
        canvasView.setDrawingUndoably(changed, actionName: tool.kind == .eraser ? "지우기" : "그리기")
        canvasView.refreshDrawingMirror()
        pencilCoordinator?.capturedStrokeDidFinish(
            in: canvasView,
            after: baseline,
            kind: tool.kind
        )
    }

    private func documentPoint(for touch: UITouch) -> CGPoint {
        guard let webView else { return .zero }
        let viewportPoint = touch.location(in: webView)
        let scrollView = webView.scrollView
        let zoom = max(scrollView.zoomScale, 0.01)
        return CGPoint(
            x: (viewportPoint.x + scrollView.contentOffset.x - scrollView.adjustedContentInset.left) / zoom,
            y: (viewportPoint.y + scrollView.contentOffset.y - scrollView.adjustedContentInset.top) / zoom
        )
    }
}

/// WebView의 hit-test와 제스처를 참고하지 않고 화면에 닿은 손가락 접촉 유무를 추적
private final class FingerPresenceGestureRecognizer: UIGestureRecognizer,
    UIGestureRecognizerDelegate
{
    var activeDidChange: ((Bool) -> Void)?
    private var activeTouches: Set<ObjectIdentifier> = []

    override init(target: Any?, action: Selector?) {
        super.init(target: target, action: action)
        delegate = self
        allowedTouchTypes = [NSNumber(value: UITouch.TouchType.direct.rawValue)]
        requiresExclusiveTouchType = false
        cancelsTouchesInView = false
        delaysTouchesBegan = false
        delaysTouchesEnded = false
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
        touches.forEach { activeTouches.insert(ObjectIdentifier($0)) }
        activeDidChange?(true)
        state = state == .possible ? .began : .changed
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) {
        state = .changed
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
        finish(touches)
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {
        finish(touches)
    }

    override func reset() {
        activeTouches.removeAll()
        activeDidChange?(false)
        super.reset()
    }

    func gestureRecognizer(
        _ gestureRecognizer: UIGestureRecognizer,
        shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
    ) -> Bool {
        true
    }

    override func canPrevent(_ preventedGestureRecognizer: UIGestureRecognizer) -> Bool {
        false
    }

    override func canBePrevented(by preventingGestureRecognizer: UIGestureRecognizer) -> Bool {
        false
    }

    private func finish(_ touches: Set<UITouch>) {
        touches.forEach { activeTouches.remove(ObjectIdentifier($0)) }
        let hasFinger = !activeTouches.isEmpty
        activeDidChange?(hasFinger)
        state = hasFinger ? .changed : .ended
    }
}

final class PencilPassthroughCanvasView: PKCanvasView {
    private weak var forwardedScrollView: UIScrollView?
    private weak var interactiveWebView: WKWebView?
    private weak var drawingMirror: PKCanvasView?
    private var navigationObservations: [NSKeyValueObservation] = []
    private var pencilCaptureRecognizer: PencilStrokeGestureRecognizer?
    private var fingerPresenceRecognizer: FingerPresenceGestureRecognizer?

    func forwardFingerNavigation(to scrollView: UIScrollView) {
        navigationObservations.removeAll()
        forwardedScrollView = scrollView
        configurePencilInputRouting(allowFingerDrawing: false)

        // WKWebView만 확대되는 경우 투명 캔버스의 잉크가 화면에 고정되어
        // 프론트엔드와 어긋난다. 두 UIScrollView의 문서 좌표계를 계속 같게
        // 유지하면 기존 획과 이후에 그리는 획 모두 같은 비율로 이동·확대된다.
        navigationObservations = [
            scrollView.observe(\.contentOffset, options: [.initial, .new]) { [weak self] _, _ in
                DispatchQueue.main.async { self?.synchronizeNavigation() }
            },
            scrollView.observe(\.contentSize, options: [.initial, .new]) { [weak self] _, _ in
                DispatchQueue.main.async { self?.synchronizeNavigation() }
            },
            scrollView.observe(\.zoomScale, options: [.initial, .new]) { [weak self] _, _ in
                DispatchQueue.main.async { self?.synchronizeNavigation() }
            },
            scrollView.observe(\.bounds, options: [.new]) { [weak self] _, _ in
                DispatchQueue.main.async { self?.synchronizeNavigation() }
            },
        ]
        synchronizeNavigation()
    }

    func installInteractivePreview(
        webView: WKWebView,
        url: URL,
        tool: DrawTool,
        coordinator: PencilCanvas.Coordinator
    ) {
        if interactiveWebView !== webView {
            interactiveWebView?.removeFromSuperview()
            drawingMirror?.removeFromSuperview()
            if let pencilCaptureRecognizer {
                removeGestureRecognizer(pencilCaptureRecognizer)
            }
            if let fingerPresenceRecognizer {
                removeGestureRecognizer(fingerPresenceRecognizer)
            }

            let mirror = PKCanvasView(frame: .zero)
            mirror.backgroundColor = .clear
            mirror.isOpaque = false
            mirror.isUserInteractionEnabled = false
            mirror.drawingPolicy = .pencilOnly
            mirror.drawing = drawing

            webView.translatesAutoresizingMaskIntoConstraints = false
            mirror.translatesAutoresizingMaskIntoConstraints = false
            addSubview(webView)
            addSubview(mirror)
            NSLayoutConstraint.activate([
                webView.leadingAnchor.constraint(equalTo: frameLayoutGuide.leadingAnchor),
                webView.trailingAnchor.constraint(equalTo: frameLayoutGuide.trailingAnchor),
                webView.topAnchor.constraint(equalTo: frameLayoutGuide.topAnchor),
                webView.bottomAnchor.constraint(equalTo: frameLayoutGuide.bottomAnchor),
                mirror.leadingAnchor.constraint(equalTo: frameLayoutGuide.leadingAnchor),
                mirror.trailingAnchor.constraint(equalTo: frameLayoutGuide.trailingAnchor),
                mirror.topAnchor.constraint(equalTo: frameLayoutGuide.topAnchor),
                mirror.bottomAnchor.constraint(equalTo: frameLayoutGuide.bottomAnchor),
            ])

            interactiveWebView = webView
            drawingMirror = mirror
            forwardFingerNavigation(to: webView.scrollView)

            let capture = PencilStrokeGestureRecognizer(
                canvasView: self,
                webView: webView,
                coordinator: coordinator
            )
            addGestureRecognizer(capture)
            pencilCaptureRecognizer = capture

            let fingerPresence = FingerPresenceGestureRecognizer(target: nil, action: nil)
            fingerPresence.activeDidChange = { [weak capture] active in
                capture?.setFingerActive(active)
            }
            addGestureRecognizer(fingerPresence)
            fingerPresenceRecognizer = fingerPresence
        }

        pencilCaptureRecognizer?.tool = tool
        // PencilKit이 drawing 변경 중 내부 subview를 갱신해도 입력 대상과 표시용 잉크 레이어의 z-order가 뒤집히지 않게 매 업데이트마다 보장
        bringSubviewToFront(webView)
        if let drawingMirror {
            bringSubviewToFront(drawingMirror)
        }
        webView.isUserInteractionEnabled = true
        webView.isMultipleTouchEnabled = true
        webView.scrollView.isUserInteractionEnabled = true
        webView.scrollView.isMultipleTouchEnabled = true
        webView.allowsBackForwardNavigationGestures = true
        webView.allowsLinkPreview = true
        webView.scrollView.keyboardDismissMode = .interactive
        webView.scrollView.delaysContentTouches = false
        webView.configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        webView.scrollView.minimumZoomScale = 0.5
        webView.scrollView.maximumZoomScale = 4.0
        webView.scrollView.pinchGestureRecognizer?.isEnabled = true

        let directOnly = [NSNumber(value: UITouch.TouchType.direct.rawValue)]
        webView.scrollView.panGestureRecognizer.allowedTouchTypes = directOnly
        webView.scrollView.panGestureRecognizer.requiresExclusiveTouchType = false
        webView.scrollView.pinchGestureRecognizer?.allowedTouchTypes = directOnly
        webView.scrollView.pinchGestureRecognizer?.requiresExclusiveTouchType = false

        drawingGestureRecognizer.isEnabled = false
        if webView.url == nil {
            webView.load(URLRequest(url: url))
        }
        refreshDrawingMirror()
        synchronizeNavigation()
    }

    fileprivate func refreshDrawingMirror() {
        guard let drawingMirror else { return }
        drawingMirror.drawing = drawing
    }

    private func synchronizeNavigation() {
        guard let scrollView = forwardedScrollView else { return }

        // KVO는 Pencil이 WebView pan을 잘못 움직인 직후에도 호출된다. 이때
        // overlay에 잘못된 offset을 복사하기 전에 먼저 WebView를 복원한다.
        if pencilCaptureRecognizer?.restoreWebNavigationIfPencilOnly() == true {
            return
        }

        let targetZoom = max(scrollView.zoomScale, 0.01)
        minimumZoomScale = min(scrollView.minimumZoomScale, targetZoom)
        maximumZoomScale = max(scrollView.maximumZoomScale, targetZoom)
        contentInset = scrollView.contentInset

        // WKWebView의 contentSize는 현재 zoom이 반영된 값 -> PencilKit에 그대로 넣고 다시 zoom하면 이중 확대되므로 기준 크기로 환산
        let baseContentSize = CGSize(
            width: max(bounds.width, scrollView.contentSize.width / targetZoom),
            height: max(bounds.height, scrollView.contentSize.height / targetZoom)
        )
        if contentSize != baseContentSize {
            contentSize = baseContentSize
        }
        if abs(zoomScale - targetZoom) > 0.0001 {
            setZoomScale(targetZoom, animated: false)
        }
        if contentOffset != scrollView.contentOffset {
            setContentOffset(scrollView.contentOffset, animated: false)
        }

        if let drawingMirror {
            drawingMirror.minimumZoomScale = minimumZoomScale
            drawingMirror.maximumZoomScale = maximumZoomScale
            drawingMirror.contentInset = contentInset
            drawingMirror.contentSize = baseContentSize
            if abs(drawingMirror.zoomScale - targetZoom) > 0.0001 {
                drawingMirror.setZoomScale(targetZoom, animated: false)
            }
            if drawingMirror.contentOffset != scrollView.contentOffset {
                drawingMirror.setContentOffset(scrollView.contentOffset, animated: false)
            }
        }
    }

    /// PKCanvasView 내부의 이동 제스처는 끄고, recognizer에는 Apple Pencil만 허용한다. 
    // 손가락 이동은 문서 ScrollView나 프리뷰의 전달 recognizer 담당
    func configurePencilInputRouting(allowFingerDrawing: Bool) {
        isUserInteractionEnabled = true
        isMultipleTouchEnabled = true
        isScrollEnabled = true
        drawingGestureRecognizer.isEnabled = true
        drawingGestureRecognizer.allowedTouchTypes = allowFingerDrawing
            ? [
                NSNumber(value: UITouch.TouchType.direct.rawValue),
                NSNumber(value: UITouch.TouchType.pencil.rawValue),
            ]
            : [NSNumber(value: UITouch.TouchType.pencil.rawValue)]
        drawingGestureRecognizer.requiresExclusiveTouchType = false
        panGestureRecognizer.isEnabled = false
        pinchGestureRecognizer?.isEnabled = false
    }

}

struct PencilCanvas: UIViewRepresentable {
    let canvasView: PKCanvasView

    var tool: DrawTool?

    var allowFingerDrawing = false
    var isActive = true
    var interactiveWebView: WKWebView? = nil
    var interactiveURL: URL? = nil

    func makeUIView(context: Context) -> PKCanvasView {
        context.coordinator.currentKind = tool?.kind
        canvasView.drawingPolicy = allowFingerDrawing ? .anyInput : .pencilOnly
        (canvasView as? PencilPassthroughCanvasView)?.configurePencilInputRouting(
            allowFingerDrawing: allowFingerDrawing
        )
        canvasView.backgroundColor = .clear
        canvasView.isOpaque = false
        canvasView.delegate = context.coordinator
        applyTool(canvasView, context: context)
        installInteractivePreviewIfNeeded(on: canvasView, context: context)
        return canvasView
    }

    func updateUIView(_ uiView: PKCanvasView, context: Context) {
        context.coordinator.currentKind = tool?.kind
        uiView.drawingPolicy = allowFingerDrawing ? .anyInput : .pencilOnly
        (uiView as? PencilPassthroughCanvasView)?.configurePencilInputRouting(
            allowFingerDrawing: allowFingerDrawing
        )
        applyTool(uiView, context: context)
        installInteractivePreviewIfNeeded(on: uiView, context: context)
    }

    private func installInteractivePreviewIfNeeded(on view: PKCanvasView, context: Context) {
        guard let interactiveWebView,
              let interactiveURL,
              let previewCanvas = view as? PencilPassthroughCanvasView else { return }
        previewCanvas.installInteractivePreview(
            webView: interactiveWebView,
            url: interactiveURL,
            tool: tool ?? DrawTool(),
            coordinator: context.coordinator
        )
    }

    private func applyTool(_ view: PKCanvasView, context: Context) {
        if let tool {
            view.tool = tool.pkTool
            context.coordinator.toolPicker.setVisible(false, forFirstResponder: view)
            if isActive { view.becomeFirstResponder() }
        } else {
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

        func canvasViewDrawingDidChange(_ canvasView: PKCanvasView) {
            (canvasView as? PencilPassthroughCanvasView)?.refreshDrawingMirror()
        }

        func canvasViewDidBeginUsingTool(_ canvasView: PKCanvasView) {
            // PencilKit은 `DidEndUsingTool`을 호출한 시점에 마지막 획을 drawing에 완전히 확정하지 않았을 수도 있음
            // 시작 시점의 개수를 기억해 새 획만 대상으로 삼고, 종료 처리는 다음 run loop에서 수행
            strokeCountAtToolBegin = canvasView.drawing.strokes.count
            strokeGeneration += 1
        }

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

        func capturedStrokeDidFinish(
            in canvasView: PKCanvasView,
            after baseline: Int,
            kind: PenKind
        ) {
            guard kind == .pen || kind == .marker else { return }
            snapLatestStroke(in: canvasView, after: baseline)
            (canvasView as? PencilPassthroughCanvasView)?.refreshDrawingMirror()
        }

        private func snapLatestStroke(in canvasView: PKCanvasView, after baseline: Int) {
            let strokes = canvasView.drawing.strokes
            guard strokes.count > baseline, let last = strokes.last else { return }

            let points = sampledPoints(of: last)
            if let arrow = ShapeSnap.snapArrow(points) {
                replaceLastStroke(with: arrow, source: last, in: canvasView)
                return
            }

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

        private func sampledPoints(of stroke: PKStroke) -> [CGPoint] {
            stroke.path.map { $0.location.applying(stroke.transform) }
        }

        private func makeStroke(outline: [CGPoint], like source: PKStroke) -> PKStroke {
            // 원본 획의 평균 굵기를 가져와 균일하게 적용
            let sizes = source.path.map { $0.size.width }
            let width = sizes.isEmpty ? 4 : sizes.reduce(0, +) / CGFloat(sizes.count)
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
