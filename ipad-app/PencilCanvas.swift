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

/// Apple Pencil은 부모 캔버스의 drawing recognizer가 받고, 손가락은 자식
/// WebView 또는 바깥 문서 ScrollView가 받는다. 터치 종류를 hit-test에서
/// 추측하지 않고 UIKit의 뷰 계층과 allowedTouchTypes로 입력을 분리한다.
final class PencilPassthroughCanvasView: PKCanvasView {
    /// 프리뷰의 투명 오버레이로 사용할 때 손가락 hit-test는 아래 WebView로
    /// 통과시키고 Apple Pencil만 이 캔버스가 받는다.
    var passesFingerTouchesThrough = false
    private weak var forwardedScrollView: UIScrollView?
    private weak var interactiveWebView: WKWebView?
    private weak var drawingMirror: PKCanvasView?
    private var navigationObservations: [NSKeyValueObservation] = []

    /// WebView가 캔버스의 앞에 있으면 Apple Pencil도 WebKit의 hit-test 대상이
    /// 되어 PencilKit drawing recognizer까지 도달하지 못한다. 제스처 설정만으로
    /// 해결할 수 없는 단계이므로 최초 hit-test에서 입력 장치별 목적지를 나눈다.
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        if passesFingerTouchesThrough {
            let touch = event?.allTouches?.min { lhs, rhs in
                squaredDistance(lhs.location(in: self), point)
                    < squaredDistance(rhs.location(in: self), point)
            }
            // 실제 iPad에서는 손가락의 첫 hit-test에서 allTouches가 아직
            // 비어 있을 수 있다. 여기서 캔버스를 반환하면 그 터치의 전체
            // 수명 동안 WebView가 버튼 클릭과 스크롤을 받지 못한다. 미확정
            // 입력은 아래 WebView로 통과시키고, 실제 Pencil 이벤트만 아래의
            // 명시적인 .pencil 분기에서 캔버스가 받는다.
            guard let touch else {
                return nil
            }
            return touch.type == .pencil ? super.hitTest(point, with: event) : nil
        }

        guard let webView = interactiveWebView else {
            return super.hitTest(point, with: event)
        }

        let touch = event?.allTouches?.min { lhs, rhs in
            squaredDistance(lhs.location(in: self), point)
                < squaredDistance(rhs.location(in: self), point)
        }

        if touch?.type == .pencil {
            // WebView와 표시 전용 mirror를 건너뛰고 PKCanvasView 내부의 실제
            // drawing surface를 찾는다. 이 뷰를 반환해야 PencilKit이 획을 만든다.
            for subview in subviews.reversed()
            where subview !== webView && subview !== drawingMirror {
                let childPoint = subview.convert(point, from: self)
                if let hitView = subview.hitTest(childPoint, with: event) {
                    return hitView
                }
            }
            return self
        }

        // 손가락과 포인터는 실제 WebView로 보내므로 링크·버튼 클릭, 스크롤,
        // 핀치 확대/축소가 원래 웹사이트와 동일하게 작동한다.
        let webPoint = webView.convert(point, from: self)
        return webView.hitTest(webPoint, with: event) ?? super.hitTest(point, with: event)
    }

    private func squaredDistance(_ lhs: CGPoint, _ rhs: CGPoint) -> CGFloat {
        let dx = lhs.x - rhs.x
        let dy = lhs.y - rhs.y
        return dx * dx + dy * dy
    }

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
    func installInteractivePreview(webView: WKWebView, url: URL) {
        if interactiveWebView !== webView {
            interactiveWebView?.removeFromSuperview()
            drawingMirror?.removeFromSuperview()

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
            navigationObservations.append(
                webView.observe(\.isLoading, options: [.initial, .new]) { [weak self, weak webView] _, _ in
                    // WebKit이 페이지 로딩 중 내부 뷰와 recognizer를 뒤늦게
                    // 추가하므로 로딩 상태가 바뀔 때마다 새 항목에도 입력
                    // 종류 제한을 적용한다.
                    DispatchQueue.main.async {
                        guard let self, let webView else { return }
                        self.restrictGestureRecognizersToFinger(in: webView)
                    }
                }
            )
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
        // WKWebView는 pan/pinch 외에도 링크, 선택, 페이지 이동 등을 위한
        // 내부 recognizer를 여러 개 만든다. 일부만 제한하면 Pencil이 그중
        // 하나에 잡혀 캔버스까지 도달하지 않는 경우가 있으므로 WebView의
        // 전체 뷰 계층을 손가락 전용으로 고정한다. 일반 탭/버튼 입력은
        // direct touch이므로 그대로 동작한다.
        restrictGestureRecognizersToFinger(in: webView)
        if webView.url == nil {
            webView.load(URLRequest(url: url))
        }
        refreshDrawingMirror()
        synchronizeNavigation()
    }

    private func restrictGestureRecognizersToFinger(in view: UIView) {
        let fingerOnly = [NSNumber(value: UITouch.TouchType.direct.rawValue)]
        view.gestureRecognizers?.forEach { recognizer in
            recognizer.allowedTouchTypes = fingerOnly
            // 펜 드로잉 recognizer와 손가락 WebView recognizer가 서로 다른
            // 입력 종류로 동시에 진행될 수 있어야 한다.
            recognizer.requiresExclusiveTouchType = false
        }
        view.subviews.forEach { restrictGestureRecognizersToFinger(in: $0) }
    }

    fileprivate func refreshDrawingMirror() {
        guard let drawingMirror else { return }
        drawingMirror.drawing = drawing
    }

    private func synchronizeNavigation() {
        guard let scrollView = forwardedScrollView else { return }

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
        canvasView.drawingPolicy = allowFingerDrawing ? .anyInput : .pencilOnly
        (canvasView as? PencilPassthroughCanvasView)?.configurePencilInputRouting(
            allowFingerDrawing: allowFingerDrawing
        )
        canvasView.backgroundColor = .clear
        canvasView.isOpaque = false
        canvasView.delegate = context.coordinator
        applyTool(canvasView, context: context)
        installInteractivePreviewIfNeeded(on: canvasView)
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
        installInteractivePreviewIfNeeded(on: uiView)
    }

    private func installInteractivePreviewIfNeeded(on view: PKCanvasView) {
        guard let interactiveWebView,
              let interactiveURL,
              let previewCanvas = view as? PencilPassthroughCanvasView else { return }
        previewCanvas.installInteractivePreview(webView: interactiveWebView, url: interactiveURL)
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
