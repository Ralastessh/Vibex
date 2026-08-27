import PencilKit
import SwiftUI
import WebKit

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

/// WebView와 같은 뷰 계층의 공통 조상에서 Apple Pencil만 관찰한다.
/// 화면의 hit-test 대상은 계속 WebView이므로 손가락 탭·스크롤·핀치는 원래
/// 경로를 유지하고, 이 recognizer는 Pencil 좌표만 PKDrawing으로 기록한다.
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

    /// 손가락의 실제 접촉 여부는 WebView의 pan 상태만으로 판별할 수 없다.
    /// Pencil도 같은 pan recognizer를 잠깐 깨울 수 있기 때문에 별도 direct-touch
    /// monitor가 알려 준 값만 신뢰한다.
    func setFingerActive(_ active: Bool) {
        guard fingerIsActive != active else { return }
        fingerIsActive = active
        if pencilIsActive {
            // 손가락을 떼는 순간의 위치를 새 기준으로 잡는다. 따라서 Pencil을
            // 계속 대고 있어도 손가락으로 이동한 결과는 보존된다.
            lockWebNavigationAtCurrentPosition()
        }
    }

    /// Pencil만 닿아 있을 때 WebView가 Pencil 이동을 scroll로 오인하면 원래
    /// offset/zoom으로 즉시 되돌린다. 손가락이 함께 닿아 있으면 아무것도
    /// 잠그지 않으므로 동시 스크롤과 pinch는 그대로 가능하다.
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

    // 손가락 WebView recognizer와 입력 종류가 다르므로 동시에 진행시킨다.
    func gestureRecognizer(
        _ gestureRecognizer: UIGestureRecognizer,
        shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
    ) -> Bool {
        true
    }

    // Pencil 캡처가 이미 진행 중인 손가락 스크롤·핀치를 중단시키지 않게 한다.
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
            // 라이브 프리뷰에서는 lasso가 WebView를 조작하지 않도록 Pencil
            // 입력을 소비한다. 선택 편집은 일반 캔버스의 SelectionOverlay가 담당한다.
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

/// WebView의 hit-test와 제스처를 가로채지 않고 화면에 닿은 손가락의 유무만
/// 추적한다. Pencil 이동으로 WebView pan이 깨어난 경우와 실제 손가락 pan을
/// 구분하기 위한 상태 센서다.
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

/// 라이브 프리뷰에서 WebView를 자식으로 호스팅하고, 공통 조상에 설치한
/// Pencil 전용 recognizer가 잉크만 기록한다. 손가락은 WebView의 원래 입력
/// 경로를 그대로 사용하므로 hit-test 단계에서 입력 장치를 추측하지 않는다.
final class PencilPassthroughCanvasView: PKCanvasView {
    private weak var forwardedScrollView: UIScrollView?
    private weak var interactiveWebView: WKWebView?
    private weak var drawingMirror: PKCanvasView?
    private var navigationObservations: [NSKeyValueObservation] = []
    private var pencilCaptureRecognizer: PencilStrokeGestureRecognizer?
    private var fingerPresenceRecognizer: FingerPresenceGestureRecognizer?

    /// 손가락 입력은 아래 WebView가 직접 받고 이 참조는 프리뷰와 잉크의
    /// 스크롤·확대 좌표를 맞추는 용도로만 사용한다.
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

    /// 라이브 프리뷰에서는 WebView를 캔버스의 자식으로 둔다. 손가락은 가장
    /// 앞의 WebView가 직접 처리하고, 부모 캔버스의 Pencil 전용 drawing
    /// recognizer는 같은 터치 계층에서 Apple Pencil만 독립적으로 받는다.
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
        // PencilKit이 drawing 변경 중 내부 subview를 갱신해도 입력 대상과
        // 표시용 잉크 레이어의 z-order가 뒤집히지 않게 매 업데이트마다 보장한다.
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

        // 공개된 스크롤 recognizer만 손가락으로 제한한다. WebKit의 private
        // 하위 recognizer는 건드리지 않는다. Pencil은 공통 조상의 capture가
        // 즉시 받아 WebView와 독립적으로 처리한다.
        let directOnly = [NSNumber(value: UITouch.TouchType.direct.rawValue)]
        webView.scrollView.panGestureRecognizer.allowedTouchTypes = directOnly
        webView.scrollView.panGestureRecognizer.requiresExclusiveTouchType = false
        webView.scrollView.pinchGestureRecognizer?.allowedTouchTypes = directOnly
        webView.scrollView.pinchGestureRecognizer?.requiresExclusiveTouchType = false

        // 라이브 프리뷰에서는 PencilKit 자체 recognizer 대신 공통 조상의
        // capture가 drawing을 작성한다. 두 recognizer가 같은 Pencil을 두고
        // 경쟁하지 않도록 native recognizer는 이 모드에서만 끈다.
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

        // WKWebView의 contentSize는 현재 zoom이 반영된 값이다. PencilKit에
        // 그대로 넣고 다시 zoom하면 이중 확대되므로 기준 크기로 환산한다.
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

    /// PKCanvasView 내부의 이동 제스처는 완전히 끄고, PencilKit의 그리기
    /// recognizer에는 Apple Pencil만 허용한다. 손가락 이동은 문서 ScrollView나
    /// 프리뷰의 전달 recognizer가 담당하므로 두 입력이 같은 recognizer에서
    /// 경쟁하지 않는다.
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
        // 손가락이 WebView를 확대·스크롤·클릭하는 동안에도 Pencil 획이
        // 중단되지 않도록 터치 종류 간 배타 처리를 끈다.
        drawingGestureRecognizer.requiresExclusiveTouchType = false
        panGestureRecognizer.isEnabled = false
        pinchGestureRecognizer?.isEnabled = false
    }

}

struct PencilCanvas: UIViewRepresentable {
    let canvasView: PKCanvasView

    // nil이면 애플 기본 팔레트를 쓴다.
    var tool: DrawTool?

    /// 손가락 입력 허용. 켜면 손바닥이 닿는 순간 획이 그려진다(시뮬레이터용).
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
        // 스냅은 새로 그린 잉크(펜/형광펜)에만. 지우개·올가미 뒤엔 안 돈다.
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

        func canvasViewDrawingDidChange(_ canvasView: PKCanvasView) {
            (canvasView as? PencilPassthroughCanvasView)?.refreshDrawingMirror()
        }

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
