import SwiftUI

// 앱 흐름: 목록 → PC 라이브 프론트엔드 → 드로잉 → 작업 상태.

extension TaskCreated: Identifiable {
    var id: String { taskId }
}

@MainActor
final class AppModel: ObservableObject {
    @Published var projects: [ProjectView] = []
    @Published var loading = false
    @Published var error: String?

    private var baseURLText: String {
        #if targetEnvironment(simulator)
        return "http://127.0.0.1:8787"
        #else
        return "http://vibex-pc:8788"
        #endif
    }

    var isConfigured: Bool {
        return true
    }

    var client: BridgeClient {
        let url = URL(string: baseURLText.trimmingCharacters(in: .whitespaces))
            ?? URL(string: "http://127.0.0.1:8787")!
        return BridgeClient(baseURL: url)
    }

    func refresh() async {
        guard isConfigured else { return }
        loading = true
        defer { loading = false }
        do {
            projects = try await client.listProjects()
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
    }
}

// MARK: - 루트

struct RootView: View {
    @StateObject private var model = AppModel()
    @State private var showSettings = false

    var body: some View {
        NavigationStack {
            Group {
                if model.isConfigured {
                    ProjectListView(model: model)
                } else {
                    NeedsSetupView { showSettings = true }
                }
            }
            .navigationTitle("Vibex")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button { showSettings = true } label: { Image(systemName: "gear") }
                }
            }
            .sheet(isPresented: $showSettings, onDismiss: { Task { await model.refresh() } }) {
                SettingsView()
            }
            .task { await model.refresh() }
        }
    }
}

// MARK: - 연결 설정

struct SettingsView: View {
    private enum ConnectionState {
        case checking
        case connected(projects: Int)
        case failed(String)
    }

    @Environment(\.dismiss) private var dismiss
    @AppStorage("allowFingerDrawing") private var allowFingerDrawing = false
    @State private var connectionState: ConnectionState = .checking

    private var connectionURL: URL {
        #if targetEnvironment(simulator)
        return URL(string: "http://127.0.0.1:8787")!
        #else
        return URL(string: "http://vibex-pc:8788")!
        #endif
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Mac 연결") {
                    switch connectionState {
                    case .checking:
                        HStack {
                            ProgressView()
                            Text("실제 연결 확인 중…")
                        }
                    case let .connected(projects):
                        Label("연결됨 · 프로젝트 \(projects)개", systemImage: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                    case let .failed(message):
                        Label("연결되지 않음", systemImage: "xmark.circle.fill")
                            .foregroundStyle(.red)
                        Text(message).font(.caption).foregroundStyle(.red)
                    }

                    #if targetEnvironment(simulator)
                    Text("시뮬레이터는 http://127.0.0.1:8787을 자동으로 사용합니다.")
                        .font(.caption).foregroundStyle(.secondary)
                    #else
                    Label("MagicDNS 자동 연결", systemImage: "network")
                    Text("http://vibex-pc:8788")
                        .font(.callout.monospaced()).textSelection(.enabled)
                    Text("iPad의 Tailscale 앱에서 Mac과 같은 tailnet으로 로그인하면 Vibex가 이 주소로 바로 접속합니다.")
                        .font(.caption).foregroundStyle(.secondary)
                    #endif

                    Button("다시 확인") {
                        Task { await checkConnection() }
                    }
                }
                Section("캔버스") {
                    Toggle("손가락으로 그리기(시뮬레이터용)", isOn: $allowFingerDrawing)
                }
            }
            .navigationTitle("연결 설정")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("완료") { dismiss() } }
            }
            .task { await checkConnection() }
        }
    }

    private func checkConnection() async {
        connectionState = .checking
        do {
            let health = try await BridgeClient(baseURL: connectionURL).health()
            guard health.status == "ok" else {
                connectionState = .failed("Vibex 백엔드가 정상 상태를 반환하지 않았습니다.")
                return
            }
            connectionState = .connected(projects: health.projects)
        } catch {
            connectionState = .failed(error.localizedDescription)
        }
    }
}

// MARK: - 프로젝트 목록

struct ProjectListView: View {
    @ObservedObject var model: AppModel

    var body: some View {
        List {
            if let error = model.error {
                Text(error).foregroundStyle(.red).font(.footnote)
            }
            ForEach(model.projects) { project in
                NavigationLink {
                    ComposeView(model: model, project: project)
                } label: {
                    HStack {
                        Circle().fill(color(project.status)).frame(width: 10, height: 10)
                        VStack(alignment: .leading) {
                            Text(project.displayName)
                            if let reason = project.reason {
                                Text(reason).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                        Spacer()
                        Text(label(project.status)).font(.caption).foregroundStyle(.secondary)
                    }
                }
                .disabled(project.status == .unavailable)
            }
        }
        .overlay {
            if model.projects.isEmpty && !model.loading {
                Text("등록된 프로젝트가 없습니다.").foregroundStyle(.secondary)
            }
        }
        .refreshable { await model.refresh() }
    }

    private func color(_ s: ProjectView.Status) -> Color {
        switch s {
        case .idle: return .green
        case .busy: return .orange
        case .unavailable: return .gray
        }
    }
    private func label(_ s: ProjectView.Status) -> String {
        switch s {
        case .idle: return "대기"
        case .busy: return "작업 중"
        case .unavailable: return "사용 불가"
        }
    }
}

// MARK: - PC 라이브 프론트엔드 → 캔버스

struct ComposeView: View {
    @ObservedObject var model: AppModel
    let project: ProjectView

    @AppStorage("allowFingerDrawing") private var allowFingerDrawing = false
    @State private var preview: PreviewView?
    @State private var loading = false
    @State private var errorText: String?

    var body: some View {
        Group {
            if let preview {
                LivePreviewEditorView(
                    model: model,
                    projectId: project.projectId,
                    previewURL: preview.url,
                    allowFingerDrawing: allowFingerDrawing
                )
            } else {
                VStack(spacing: 16) {
                    if loading { ProgressView("PC에서 프론트엔드를 시작하는 중…") }
                    if let errorText { Text(errorText).foregroundStyle(.red) }
                    Button("다시 시작") { Task { await startPreview() } }
                        .buttonStyle(.borderedProminent).disabled(loading)
                }
            }
        }
        .navigationTitle(project.displayName)
        .task(id: project.projectId) { await startPreview() }
    }

    private func startPreview() async {
        loading = true
        defer { loading = false }
        do {
            preview = try await model.client.startPreview(projectId: project.projectId)
            errorText = nil
        } catch {
            errorText = error.localizedDescription
        }
    }
}

// MARK: - 작업 상태 (폴링 + 승인 + 질문 응답)

struct TaskStatusView: View {
    @ObservedObject var model: AppModel
    let taskId: String

    @State private var task: TaskView?
    @State private var errorText: String?
    @State private var customAnswers: [String: String] = [:]

    var body: some View {
        NavigationStack {
            List {
                if let task {
                    Section("상태") { Text(statusLabel(task.status)) }

                    if let summary = task.summary, !summary.isEmpty {
                        Section("요약") { Text(summary) }
                    }
                    if let reply = task.agentReply, !reply.isEmpty {
                        Section("에이전트") { Text(reply) }
                    }

                    if task.status == .awaitingConfirmation, !task.questions.isEmpty {
                        ForEach(task.questions) { q in
                            Section(q.text) {
                                ForEach(q.options) { opt in
                                    Button(opt.label) {
                                        act {
                                            _ = try await model.client.answer(
                                                taskId, questionId: q.questionId, optionId: opt.optionId
                                            )
                                        }
                                    }
                                }
                                HStack {
                                    TextField(
                                        "원하는 답을 직접 입력",
                                        text: Binding(
                                            get: { customAnswers[q.questionId, default: ""] },
                                            set: { customAnswers[q.questionId] = $0 }
                                        )
                                    )
                                    Button("전송") {
                                        let text = customAnswers[q.questionId, default: ""]
                                            .trimmingCharacters(in: .whitespacesAndNewlines)
                                        guard !text.isEmpty else { return }
                                        act {
                                            _ = try await model.client.answer(
                                                taskId,
                                                questionId: q.questionId,
                                                freeText: text
                                            )
                                        }
                                    }
                                    .disabled(
                                        customAnswers[q.questionId, default: ""]
                                            .trimmingCharacters(in: .whitespacesAndNewlines)
                                            .isEmpty
                                    )
                                }
                            }
                        }
                    }
                    if !task.changedFiles.isEmpty {
                        Section("변경 파일") {
                            ForEach(task.changedFiles, id: \.path) { f in
                                VStack(alignment: .leading) {
                                    Text(f.path).font(.callout.monospaced())
                                    if !f.summary.isEmpty {
                                        Text(f.summary).font(.caption).foregroundStyle(.secondary)
                                    }
                                }
                            }
                        }
                    }
                    if !task.testResults.isEmpty {
                        Section("테스트") {
                            ForEach(task.testResults, id: \.command) { t in
                                HStack {
                                    Image(systemName: testIcon(t.status)).foregroundStyle(testColor(t.status))
                                    Text(t.command).font(.callout.monospaced())
                                }
                            }
                        }
                    }
                    if let e = task.error {
                        Section("오류") { Text(e).foregroundStyle(.red) }
                    }
                } else if let errorText {
                    Text(errorText).foregroundStyle(.red)
                } else {
                    ProgressView("불러오는 중…")
                }
            }
            .navigationTitle("작업")
            .task(id: taskId) { await poll() }
        }
    }

    // 끝날 때까지 폴링.
    private func poll() async {
        while !Task.isCancelled {
            do {
                let t = try await model.client.task(taskId)
                task = t
                if !t.status.isActive { break }
            } catch {
                errorText = error.localizedDescription
                break
            }
            try? await Task.sleep(nanoseconds: 1_500_000_000)
        }
    }

    // 답 보내고 다시 폴링.
    private func act(_ work: @escaping () async throws -> Void) {
        Task {
            do { try await work(); await poll() }
            catch { errorText = error.localizedDescription }
        }
    }

    private func statusLabel(_ s: TaskStatus) -> String {
        switch s {
        case .queued: return "대기 중"
        case .interpreting: return "이미지 준비 중…"
        case .awaitingConfirmation: return "확인 필요"
        case .resolvingSession: return "세션 준비 중…"
        case .runningAgent: return "코드 수정 중…"
        case .testing: return "테스트 실행 중…"
        case .completed: return "완료"
        case .failed: return "실패"
        case .cancelled: return "취소됨"
        }
    }
    private func testIcon(_ s: String) -> String {
        s == "passed" ? "checkmark.circle.fill" : s == "failed" ? "xmark.circle.fill" : "minus.circle"
    }
    private func testColor(_ s: String) -> Color {
        s == "passed" ? .green : s == "failed" ? .red : .gray
    }
}

// MARK: - 빈 상태

struct NeedsSetupView: View {
    let action: () -> Void
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "antenna.radiowaves.left.and.right.slash")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text("연결 설정이 필요합니다").font(.headline)
            Text("iPad의 Tailscale 앱에서 Mac과 같은 tailnet으로 로그인하세요.")
                .font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)
            Button("연결 확인", action: action).buttonStyle(.borderedProminent).padding(.top, 4)
        }
        .padding()
    }
}
