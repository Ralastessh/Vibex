import PencilKit
import Foundation
import SwiftUI
import WebKit

/// PC에서 실행한 프론트엔드를 그대로 조작하고, 같은 화면 좌표계에 주석을 그린다.
struct LivePreviewEditorView: View {
    @ObservedObject var model: AppModel
    let projectId: String
    let conversationId: String
    let agentId: String
    let previewURL: URL
    var allowFingerDrawing = false

    @State private var webView = WKWebView(frame: .zero)
    @State private var canvasView = PKCanvasView()
    @State private var drawingMode = false
    @State private var shapeSnapEnabled = false
    @State private var note = ""
    @State private var sending = false
    @State private var clientTaskId = UUID().uuidString
    @State private var activeTaskId: String?
    @State private var questions: [Question] = []
    @State private var overlayFrames: [String: CGRect] = [:]
    @State private var customAnswers: [String: String] = [:]
    @State private var currentStatus: TaskStatus?
    @State private var created: TaskCreated?
    @State private var errorMessage: String?

    @Environment(\.displayScale) private var displayScale

    var body: some View {
        GeometryReader { geo in
            ZStack {
                LiveWebView(webView: webView, url: previewURL)
                    .allowsHitTesting(!drawingMode && questions.isEmpty)

                PencilCanvas(
                    canvasView: canvasView,
                    shapeSnapEnabled: $shapeSnapEnabled,
                    allowFingerDrawing: allowFingerDrawing,
                    isActive: drawingMode
                )
                .allowsHitTesting(drawingMode && questions.isEmpty)
                .opacity(drawingMode ? 1 : 0)

                if !questions.isEmpty {
                    clarificationLayer(size: geo.size)
                }

                toolbar
                    .frame(maxHeight: .infinity, alignment: .top)
                    .padding(.top, 12)
            }
            .frame(width: geo.size.width, height: geo.size.height)
            .onChange(of: geo.size) { _ in
                refreshOverlayFramesAfterLayout()
            }
        }
        .background(Color(uiColor: .systemBackground))
        .sheet(item: $created) { item in
            TaskStatusView(model: model, taskId: item.taskId)
        }
        .alert(
            "처리하지 못했습니다",
            isPresented: Binding(
                get: { errorMessage != nil },
                set: { if !$0 { errorMessage = nil } }
            )
        ) {
            Button("확인", role: .cancel) {}
        } message: {
            Text(errorMessage ?? "")
        }
    }

    private var toolbar: some View {
        HStack(spacing: 8) {
            Picker("입력 모드", selection: $drawingMode) {
                Image(systemName: "hand.point.up.left.fill").tag(false)
                Image(systemName: "pencil.tip").tag(true)
            }
            .pickerStyle(.segmented)
            .frame(width: 116)

            if drawingMode {
                Button { canvasView.undoManager?.undo() } label: {
                    Image(systemName: "arrow.uturn.backward")
                }
                Button { canvasView.undoManager?.redo() } label: {
                    Image(systemName: "arrow.uturn.forward")
                }
                Toggle(isOn: $shapeSnapEnabled) {
                    Image(systemName: "square.on.circle")
                }
                .toggleStyle(.button)
            } else {
                Button { webView.reload() } label: { Image(systemName: "arrow.clockwise") }
            }

            TextField("추가 설명", text: $note)
                .textFieldStyle(.roundedBorder)
                .frame(maxWidth: 280)

            if let currentStatus {
                Text(statusLabel(currentStatus))
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }

            Spacer(minLength: 8)

            if activeTaskId != nil {
                Button(role: .destructive) { cancelActiveTask() } label: {
                    Image(systemName: "xmark.circle")
                }
            }

            Button(action: sendDrawing) {
                if sending {
                    ProgressView().frame(width: 32, height: 32)
                } else {
                    Label("전송", systemImage: "paperplane.fill")
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(sending || activeTaskId != nil || !drawingMode)
        }
        .padding(8)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 14))
        .padding(.horizontal, 16)
    }

    private func clarificationLayer(size: CGSize) -> some View {
        ZStack {
            Color.clear.contentShape(Rectangle()).ignoresSafeArea()
            ForEach(questions) { question in
                if let target = question.overlay {
                    let frame = targetFrame(for: question, target: target, in: size)
                    targetShape(target)
                        .frame(
                            width: max(44, frame.width),
                            height: max(44, frame.height)
                        )
                        .position(x: frame.midX, y: frame.midY)
                }
                let cardWidth = min(620, size.width - 32)
                questionCard(question)
                    .frame(width: cardWidth)
                    .position(
                        cardPosition(
                            for: question.overlay.map {
                                targetFrame(for: question, target: $0, in: size)
                            },
                            cardWidth: cardWidth,
                            in: size
                        )
                    )
            }
        }
    }

    @ViewBuilder
    private func targetShape(_ target: OverlayTarget) -> some View {
        let stroke = Color.accentColor.opacity(0.92)
        let glass = Color.accentColor.opacity(0.055)
        let highlight = Color.white.opacity(0.72)
        switch target.shape {
        case "ellipse":
            Ellipse()
                .fill(glass)
                .overlay(Ellipse().stroke(stroke, lineWidth: 2.25))
                .overlay(Ellipse().inset(by: 3).stroke(highlight, lineWidth: 0.7))
        case "capsule":
            Capsule()
                .fill(glass)
                .overlay(Capsule().stroke(stroke, lineWidth: 2.25))
                .overlay(Capsule().inset(by: 3).stroke(highlight, lineWidth: 0.7))
        default:
            RoundedRectangle(cornerRadius: 10)
                .fill(glass)
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(stroke, lineWidth: 2.25))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .inset(by: 3)
                        .stroke(highlight, lineWidth: 0.7)
                )
        }
    }

    private func questionCard(_ question: Question) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            if let label = question.overlay?.label, !label.isEmpty {
                Text(label).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            }
            Text(question.text).font(.headline)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(question.options) { option in
                        Button(option.label) { answer(question: question, option: option) }
                            .buttonStyle(.borderedProminent)
                    }

                    HStack(spacing: 6) {
                        TextField("직접 입력", text: customAnswerBinding(for: question))
                            .textFieldStyle(.plain)
                            .submitLabel(.send)
                            .onSubmit { answerWithFreeText(question: question) }
                        Button { answerWithFreeText(question: question) } label: {
                            Image(systemName: "arrow.up")
                                .font(.caption.bold())
                                .frame(width: 25, height: 25)
                        }
                        .buttonStyle(.borderedProminent)
                        .buttonBorderShape(.capsule)
                        .disabled(customAnswer(for: question).isEmpty || sending)
                    }
                    .frame(width: 210)
                    .padding(.leading, 12)
                    .padding(.trailing, 5)
                    .padding(.vertical, 5)
                    .background(
                        Color(uiColor: .secondarySystemBackground).opacity(0.82),
                        in: Capsule()
                    )
                    .overlay(Capsule().stroke(Color.white.opacity(0.5), lineWidth: 0.7))
                }
            }
        }
        .padding(14)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.45), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.18), radius: 16, y: 8)
    }

    private func cardPosition(
        for target: CGRect?, cardWidth: CGFloat, in size: CGSize
    ) -> CGPoint {
        guard let target else { return CGPoint(x: size.width / 2, y: size.height * 0.72) }
        let halfWidth = cardWidth / 2
        let x = min(max(halfWidth + 16, target.midX), size.width - halfWidth - 16)
        let halfHeight: CGFloat = 92
        let below = target.maxY + halfHeight + 16
        let above = target.minY - halfHeight - 16
        let y = below <= size.height - 16 ? below : max(112, above)
        return CGPoint(x: x, y: y)
    }

    private func targetFrame(
        for question: Question, target: OverlayTarget, in size: CGSize
    ) -> CGRect {
        if let resolved = overlayFrames[question.questionId],
           resolved.width > 0, resolved.height > 0 {
            return resolved
        }
        return CGRect(
            x: size.width * target.x,
            y: size.height * target.y,
            width: size.width * target.width,
            height: size.height * target.height
        )
    }

    private func customAnswerBinding(for question: Question) -> Binding<String> {
        Binding(
            get: { customAnswers[question.questionId, default: ""] },
            set: { customAnswers[question.questionId] = $0 }
        )
    }

    private func customAnswer(for question: Question) -> String {
        customAnswers[question.questionId, default: ""]
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func resolveOverlayFrames(for pendingQuestions: [Question]) async {
        var frames: [String: CGRect] = [:]
        for question in pendingQuestions {
            guard let target = question.overlay else { continue }
            if let frame = try? await webView.resolveOverlayAnchor(
                id: question.questionId,
                target: target
            ) {
                frames[question.questionId] = frame
            }
        }
        overlayFrames = frames
    }

    private func refreshOverlayFramesAfterLayout() {
        guard !questions.isEmpty else { return }
        let visibleQuestions = questions
        Task { @MainActor in
            // WKWebView의 CSS viewport는 SwiftUI 회전 레이아웃보다 한 박자 늦게
            // 갱신될 수 있어 두 번 측정한다.
            try? await Task.sleep(nanoseconds: 120_000_000)
            await refreshResolvedOverlayFrames(for: visibleQuestions)
            try? await Task.sleep(nanoseconds: 280_000_000)
            await refreshResolvedOverlayFrames(for: visibleQuestions)
        }
    }

    private func refreshResolvedOverlayFrames(for visibleQuestions: [Question]) async {
        guard questions.map(\.questionId) == visibleQuestions.map(\.questionId) else { return }
        var refreshed = overlayFrames
        for question in visibleQuestions where question.overlay != nil {
            if let frame = try? await webView.measureOverlayAnchor(id: question.questionId) {
                refreshed[question.questionId] = frame
            }
        }
        overlayFrames = refreshed
    }

    private func sendDrawing() {
        guard !sending, activeTaskId == nil else { return }
        guard !canvasView.drawing.strokes.isEmpty else {
            errorMessage = "먼저 수정할 부분을 그려 주세요."
            return
        }
        sending = true
        Task {
            do {
                let rendered = try await webView.snapshotImage()
                guard let snapshot = CanvasComposer.snapshot(
                    background: rendered,
                    drawing: canvasView.drawing,
                    canvasBounds: canvasView.bounds,
                    displayScale: displayScale
                ) else {
                    throw BridgeError(message: "라이브 화면을 전송 이미지로 만들지 못했습니다.", statusCode: nil)
                }
                let result = try await model.client.createTask(
                    projectId: projectId,
                    snapshot: snapshot,
                    typedNote: note,
                    clientTaskId: clientTaskId,
                    conversationId: conversationId,
                    agentId: agentId
                )
                activeTaskId = result.taskId
                currentStatus = result.status
                canvasView.drawing = PKDrawing()
                drawingMode = false
                note = ""
                clientTaskId = UUID().uuidString
                await monitor(taskId: result.taskId)
            } catch {
                errorMessage = error.localizedDescription
            }
            sending = false
        }
    }

    private func monitor(taskId: String) async {
        while !Task.isCancelled {
            do {
                let task = try await model.client.task(taskId)
                currentStatus = task.status
                if task.status == .awaitingConfirmation, !task.questions.isEmpty {
                    questions = task.questions
                    customAnswers = [:]
                    await resolveOverlayFrames(for: task.questions)
                    return
                }
                if !task.status.isActive {
                    activeTaskId = nil
                    questions = []
                    overlayFrames = [:]
                    customAnswers = [:]
                    created = TaskCreated(
                        taskId: task.taskId,
                        status: task.status,
                        conversationId: task.conversationId
                    )
                    return
                }
            } catch {
                errorMessage = error.localizedDescription
                return
            }
            try? await Task.sleep(nanoseconds: 1_200_000_000)
        }
    }

    private func answer(question: Question, option: QuestionOption) {
        guard let taskId = activeTaskId else { return }
        questions = []
        overlayFrames = [:]
        sending = true
        Task {
            do {
                _ = try await model.client.answer(
                    taskId, questionId: question.questionId, optionId: option.optionId
                )
                await monitor(taskId: taskId)
            } catch {
                questions = [question]
                await resolveOverlayFrames(for: [question])
                errorMessage = error.localizedDescription
            }
            sending = false
        }
    }

    private func answerWithFreeText(question: Question) {
        guard let taskId = activeTaskId else { return }
        let answerText = customAnswer(for: question)
        guard !answerText.isEmpty else { return }
        questions = []
        overlayFrames = [:]
        sending = true
        Task {
            do {
                _ = try await model.client.answer(
                    taskId,
                    questionId: question.questionId,
                    freeText: answerText
                )
                customAnswers[question.questionId] = ""
                await monitor(taskId: taskId)
            } catch {
                questions = [question]
                await resolveOverlayFrames(for: [question])
                errorMessage = error.localizedDescription
            }
            sending = false
        }
    }

    private func cancelActiveTask() {
        guard let taskId = activeTaskId else { return }
        Task {
            do {
                _ = try await model.client.cancel(taskId)
                activeTaskId = nil
                questions = []
                overlayFrames = [:]
                customAnswers = [:]
                currentStatus = .cancelled
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func statusLabel(_ status: TaskStatus) -> String {
        switch status {
        case .queued: return "대기 중"
        case .interpreting: return "이미지 준비 중"
        case .resolvingSession: return "세션 찾는 중"
        case .runningAgent: return "CLI 작업 중"
        case .awaitingConfirmation: return "선택 필요"
        case .testing: return "테스트 중"
        case .completed: return "완료"
        case .failed: return "실패"
        case .cancelled: return "취소"
        }
    }
}


private struct LiveWebView: UIViewRepresentable {
    let webView: WKWebView
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.keyboardDismissMode = .interactive
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ view: WKWebView, context: Context) {
        if view.url == nil { view.load(URLRequest(url: url)) }
    }
}


private extension WKWebView {
    @MainActor
    func snapshotImage() async throws -> UIImage {
        try await withCheckedThrowingContinuation { continuation in
            takeSnapshot(with: nil) { image, error in
                if let image {
                    continuation.resume(returning: image)
                } else {
                    continuation.resume(
                        throwing: error ?? BridgeError(
                            message: "라이브 프론트엔드를 캡처하지 못했습니다.", statusCode: nil
                        )
                    )
                }
            }
        }
    }

    /// LLM이 이미지에서 지정한 사각형 아래의 실제 DOM 요소를 찾아 앵커로 보관한다.
    /// 이후 반응형 레이아웃이 바뀌어도 같은 요소의 새 DOMRect에서 영역을 복원한다.
    @MainActor
    func resolveOverlayAnchor(id: String, target: OverlayTarget) async throws -> CGRect {
        let marker = try Self.javaScriptLiteral(id)
        let script = """
        (() => {
          const marker = \(marker);
          const target = {
            x: \(target.x), y: \(target.y),
            width: \(target.width), height: \(target.height)
          };
          const vw = Math.max(window.innerWidth, 1);
          const vh = Math.max(window.innerHeight, 1);
          const wanted = {
            left: target.x * vw,
            top: target.y * vh,
            width: target.width * vw,
            height: target.height * vh
          };
          wanted.right = wanted.left + wanted.width;
          wanted.bottom = wanted.top + wanted.height;

          const candidates = new Set();
          for (const fx of [0.18, 0.5, 0.82]) {
            for (const fy of [0.18, 0.5, 0.82]) {
              const px = Math.min(vw - 1, Math.max(0, wanted.left + wanted.width * fx));
              const py = Math.min(vh - 1, Math.max(0, wanted.top + wanted.height * fy));
              for (const element of document.elementsFromPoint(px, py)) candidates.add(element);
            }
          }

          const intersection = (a, b) => {
            const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
            const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
            return width * height;
          };
          let best = null;
          let bestScore = -Infinity;
          for (const element of candidates) {
            if (!(element instanceof Element) || element === document.documentElement || element === document.body) continue;
            const style = getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
            const rect = element.getBoundingClientRect();
            if (rect.width < 4 || rect.height < 4) continue;
            const overlap = intersection(rect, wanted);
            if (overlap <= 0) continue;
            const elementArea = rect.width * rect.height;
            const wantedArea = Math.max(wanted.width * wanted.height, 1);
            const union = elementArea + wantedArea - overlap;
            const similarity = Math.min(elementArea, wantedArea) / Math.max(elementArea, wantedArea);
            const semantic = /^(H1|H2|H3|P|BUTTON|A|INPUT|TEXTAREA|IMG|SVG)$/.test(element.tagName) ? 0.55 : 0;
            const score = (overlap / union) * 4
              + similarity * 2
              + overlap / elementArea
              + (overlap / wantedArea) * 0.5
              + semantic;
            if (score > bestScore) {
              best = element;
              bestScore = score;
            }
          }

          const selectorFor = (element) => {
            if (element.id) return '#' + CSS.escape(element.id);
            const parts = [];
            let current = element;
            while (current && current !== document.body && parts.length < 6) {
              let part = current.tagName.toLowerCase();
              if (current.classList.length) {
                part += '.' + Array.from(current.classList).slice(0, 2).map(CSS.escape).join('.');
              }
              const siblings = current.parentElement
                ? Array.from(current.parentElement.children).filter(item => item.tagName === current.tagName)
                : [];
              if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
              parts.unshift(part);
              current = current.parentElement;
            }
            return parts.join(' > ');
          };

          window.__vibexOverlayAnchors = window.__vibexOverlayAnchors || {};
          const state = { target };
          if (best) {
            const rect = best.getBoundingClientRect();
            state.element = best;
            state.selector = selectorFor(best);
            state.leftRatio = (wanted.left - rect.left) / Math.max(rect.width, 1);
            state.topRatio = (wanted.top - rect.top) / Math.max(rect.height, 1);
            state.widthRatio = wanted.width / Math.max(rect.width, 1);
            state.heightRatio = wanted.height / Math.max(rect.height, 1);
            best.setAttribute('data-vibex-overlay-anchor', marker);
          }
          window.__vibexOverlayAnchors[marker] = state;

          window.__vibexMeasureOverlay = (key) => {
            const saved = window.__vibexOverlayAnchors && window.__vibexOverlayAnchors[key];
            const width = Math.max(window.innerWidth, 1);
            const height = Math.max(window.innerHeight, 1);
            if (!saved) return null;
            let element = saved.element;
            if (!element || !element.isConnected) {
              try { element = saved.selector ? document.querySelector(saved.selector) : null; }
              catch (_) { element = null; }
            }
            if (element) {
              saved.element = element;
              const rect = element.getBoundingClientRect();
              return {
                x: rect.left + saved.leftRatio * rect.width,
                y: rect.top + saved.topRatio * rect.height,
                width: saved.widthRatio * rect.width,
                height: saved.heightRatio * rect.height,
                viewportWidth: width,
                viewportHeight: height,
                anchored: true
              };
            }
            return {
              x: saved.target.x * width,
              y: saved.target.y * height,
              width: saved.target.width * width,
              height: saved.target.height * height,
              viewportWidth: width,
              viewportHeight: height,
              anchored: false
            };
          };
          return window.__vibexMeasureOverlay(marker);
        })();
        """
        let value = try await evaluate(script)
        return try overlayFrame(from: value)
    }

    @MainActor
    func measureOverlayAnchor(id: String) async throws -> CGRect {
        let marker = try Self.javaScriptLiteral(id)
        let result = try await evaluate(
            "window.__vibexMeasureOverlay ? window.__vibexMeasureOverlay(\(marker)) : null"
        )
        return try overlayFrame(from: result)
    }

    @MainActor
    private func evaluate(_ script: String) async throws -> Any {
        try await withCheckedThrowingContinuation { continuation in
            evaluateJavaScript(script) { value, error in
                if let error {
                    continuation.resume(throwing: error)
                } else if let value {
                    continuation.resume(returning: value)
                } else {
                    continuation.resume(
                        throwing: BridgeError(
                            message: "웹 요소의 위치를 계산하지 못했습니다.", statusCode: nil
                        )
                    )
                }
            }
        }
    }

    @MainActor
    private func overlayFrame(from value: Any) throws -> CGRect {
        guard let object = value as? [String: Any],
              let x = Self.number(object["x"]),
              let y = Self.number(object["y"]),
              let width = Self.number(object["width"]),
              let height = Self.number(object["height"]),
              let viewportWidth = Self.number(object["viewportWidth"]),
              let viewportHeight = Self.number(object["viewportHeight"]),
              viewportWidth > 0, viewportHeight > 0 else {
            throw BridgeError(message: "웹 요소 좌표가 올바르지 않습니다.", statusCode: nil)
        }
        let scaleX = bounds.width / viewportWidth
        let scaleY = bounds.height / viewportHeight
        return CGRect(
            x: x * scaleX,
            y: y * scaleY,
            width: width * scaleX,
            height: height * scaleY
        )
    }

    private static func javaScriptLiteral(_ value: String) throws -> String {
        let data = try JSONEncoder().encode(value)
        guard let encoded = String(data: data, encoding: .utf8) else {
            throw BridgeError(message: "질문 식별자를 인코딩하지 못했습니다.", statusCode: nil)
        }
        return encoded
    }

    private static func number(_ value: Any?) -> CGFloat? {
        guard let number = value as? NSNumber else { return nil }
        return CGFloat(truncating: number)
    }
}
