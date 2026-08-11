import PencilKit
import SwiftUI
import WebKit

/// PC에서 실행한 프론트엔드를 그대로 조작하고, 같은 화면 좌표계에 주석을 그린다.
struct LivePreviewEditorView: View {
    @ObservedObject var model: AppModel
    let projectId: String
    let previewURL: URL
    var allowFingerDrawing = false

    @State private var webView = WKWebView(frame: .zero)
    @State private var canvasView = PKCanvasView()
    @State private var drawingMode = false
    @State private var shapeSnapEnabled = true
    @State private var tool = DrawTool()
    @State private var selection: Set<Int> = []
    @State private var note = ""
    @State private var sending = false
    @State private var clientTaskId = UUID().uuidString
    @State private var activeTaskId: String?
    @State private var questions: [Question] = []
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
                    tool: tool,
                    allowFingerDrawing: allowFingerDrawing,
                    isActive: drawingMode
                )
                .allowsHitTesting(drawingMode && questions.isEmpty && tool.kind != .lasso)
                .opacity(drawingMode ? 1 : 0)

                if drawingMode && questions.isEmpty && tool.kind == .lasso {
                    SelectionOverlay(canvasView: canvasView, selection: $selection)
                }

                if !questions.isEmpty {
                    clarificationLayer(size: geo.size)
                }

                VStack(spacing: 8) {
                    toolbar
                    if drawingMode {
                        DrawingToolbar(tool: $tool)
                    }
                }
                .frame(maxHeight: .infinity, alignment: .top)
                .padding(.top, 12)
            }
            .frame(width: geo.size.width, height: geo.size.height)
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
        .onChange(of: tool.kind) { kind in if kind != .lasso { selection = [] } }
        .onChange(of: drawingMode) { active in if !active { selection = [] } }
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
            Color.black.opacity(0.08).ignoresSafeArea()
            ForEach(questions) { question in
                if let target = question.overlay {
                    targetShape(target)
                        .frame(
                            width: max(44, size.width * target.width),
                            height: max(44, size.height * target.height)
                        )
                        .position(
                            x: size.width * (target.x + target.width / 2),
                            y: size.height * (target.y + target.height / 2)
                        )
                }
                questionCard(question)
                    .frame(width: min(330, size.width - 32))
                    .position(cardPosition(for: question.overlay, in: size))
            }
        }
    }

    @ViewBuilder
    private func targetShape(_ target: OverlayTarget) -> some View {
        let stroke = Color.accentColor.opacity(0.9)
        switch target.shape {
        case "ellipse":
            Ellipse().fill(.ultraThinMaterial).overlay(Ellipse().stroke(stroke, lineWidth: 3))
        case "capsule":
            Capsule().fill(.ultraThinMaterial).overlay(Capsule().stroke(stroke, lineWidth: 3))
        default:
            RoundedRectangle(cornerRadius: 10)
                .fill(.ultraThinMaterial)
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(stroke, lineWidth: 3))
        }
    }

    private func questionCard(_ question: Question) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            if let label = question.overlay?.label, !label.isEmpty {
                Text(label).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            }
            Text(question.text).font(.headline)
            HStack {
                ForEach(question.options) { option in
                    Button(option.label) { answer(question: question, option: option) }
                        .buttonStyle(.borderedProminent)
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

    private func cardPosition(for target: OverlayTarget?, in size: CGSize) -> CGPoint {
        guard let target else { return CGPoint(x: size.width / 2, y: size.height * 0.72) }
        let x = min(max(181, size.width * (target.x + target.width / 2)), size.width - 181)
        let below = size.height * (target.y + target.height) + 110
        let y = below < size.height - 100 ? below : max(120, size.height * target.y - 110)
        return CGPoint(x: x, y: y)
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
                    clientTaskId: clientTaskId
                )
                activeTaskId = result.taskId
                currentStatus = result.status
                canvasView.drawing = PKDrawing()
                selection = []
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
                    return
                }
                if !task.status.isActive {
                    activeTaskId = nil
                    questions = []
                    created = TaskCreated(taskId: task.taskId, status: task.status)
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
        sending = true
        Task {
            do {
                _ = try await model.client.answer(
                    taskId, questionId: question.questionId, optionId: option.optionId
                )
                await monitor(taskId: taskId)
            } catch {
                questions = [question]
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
}
