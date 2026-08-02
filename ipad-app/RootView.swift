import PhotosUI
import SwiftUI

// 실제 앱 흐름: 연결설정 → 프로젝트 목록 → 스크린샷 → 캔버스 → 작업 상태(승인/질문응답).
// 캔버스·전송은 main의 AnnotationCanvasView/BridgeClient를 그대로 쓴다.

extension TaskCreated: Identifiable {
    var id: String { taskId }
}

@MainActor
final class AppModel: ObservableObject {
    @Published var projects: [ProjectView] = []
    @Published var loading = false
    @Published var error: String?

    private var baseURLText: String {
        UserDefaults.standard.string(forKey: "bridgeBaseURL") ?? "http://127.0.0.1:8000"
    }
    private var token: String {
        UserDefaults.standard.string(forKey: "bridgeToken") ?? ""
    }

    var isConfigured: Bool {
        !token.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var client: BridgeClient {
        let url = URL(string: baseURLText.trimmingCharacters(in: .whitespaces))
            ?? URL(string: "http://127.0.0.1:8000")!
        return BridgeClient(baseURL: url, deviceToken: token)
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
    @Environment(\.dismiss) private var dismiss
    @AppStorage("bridgeBaseURL") private var baseURL = "http://127.0.0.1:8000"
    @AppStorage("bridgeToken") private var token = ""
    @AppStorage("allowFingerDrawing") private var allowFingerDrawing = false

    var body: some View {
        NavigationStack {
            Form {
                Section("iMac 연결") {
                    TextField("http://100.x.x.x:8000", text: $baseURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                    SecureField("기기 토큰", text: $token)
                }
                Section("캔버스") {
                    Toggle("손가락으로 그리기(시뮬레이터용)", isOn: $allowFingerDrawing)
                }
            }
            .navigationTitle("연결 설정")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("완료") { dismiss() } }
            }
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

// MARK: - 스크린샷 선택 → 캔버스

struct ComposeView: View {
    @ObservedObject var model: AppModel
    let project: ProjectView

    @AppStorage("allowFingerDrawing") private var allowFingerDrawing = false
    @State private var pickerItem: PhotosPickerItem?
    @State private var screenshot: UIImage?
    @State private var created: TaskCreated?

    var body: some View {
        Group {
            if let screenshot {
                AnnotationCanvasView(
                    projectId: project.projectId,
                    screenshot: screenshot,
                    client: model.client,
                    allowFingerDrawing: allowFingerDrawing
                ) { created in
                    self.created = created
                }
            } else {
                VStack(spacing: 16) {
                    Text("수정할 화면을 고르세요.").foregroundStyle(.secondary)
                    PhotosPicker("스크린샷 선택", selection: $pickerItem, matching: .images)
                        .buttonStyle(.borderedProminent)
                    Button("샘플 화면으로 시험") { screenshot = SampleScreenshot.loginScreen() }
                        .buttonStyle(.bordered)
                }
            }
        }
        .navigationTitle(project.displayName)
        .onChange(of: pickerItem) { item in
            Task {
                if let data = try? await item?.loadTransferable(type: Data.self),
                   let img = UIImage(data: data) {
                    screenshot = img
                }
            }
        }
        .sheet(item: $created) { TaskStatusView(model: model, taskId: $0.taskId) }
    }
}

// MARK: - 작업 상태 (폴링 + 승인 + 질문 응답)

struct TaskStatusView: View {
    @ObservedObject var model: AppModel
    let taskId: String

    @State private var task: TaskView?
    @State private var errorText: String?

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

                    if needsConfirmation(task), let c = task.interpretation {
                        Section("해석 결과") {
                            Text(c.summary)
                            Text("신뢰도 \(Int(c.overallConfidence * 100))%")
                                .font(.caption).foregroundStyle(.secondary)
                            HStack {
                                Button("승인") {
                                    act { _ = try await model.client.confirm(taskId, approved: true) }
                                }
                                .buttonStyle(.borderedProminent)
                                Button("취소", role: .destructive) {
                                    act { _ = try await model.client.confirm(taskId, approved: false) }
                                }
                            }
                        }
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

    private func needsConfirmation(_ task: TaskView) -> Bool {
        task.status == .awaitingConfirmation && task.interpretation != nil && task.questions.isEmpty
    }

    // 끝날 때까지 폴링. 끊겨도 다시 열면 이어진다.
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

    // 승인·응답 후 다시 폴링을 태운다.
    private func act(_ work: @escaping () async throws -> Void) {
        Task {
            do { try await work(); await poll() }
            catch { errorText = error.localizedDescription }
        }
    }

    private func statusLabel(_ s: TaskStatus) -> String {
        switch s {
        case .queued: return "대기 중"
        case .interpreting: return "그림 해석 중…"
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
            Text("Mac Bridge 주소와 기기 토큰을 입력하세요.")
                .font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)
            Button("연결 설정", action: action).buttonStyle(.borderedProminent).padding(.top, 4)
        }
        .padding()
    }
}
