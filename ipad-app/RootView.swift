import PhotosUI
import SwiftUI

/// 앱 상태 — 설정과 프로젝트 목록을 들고, Bridge 호출을 감싼다.
@MainActor
final class AppModel: ObservableObject {
    @Published var config: AppConfig
    @Published var projects: [Project] = []
    @Published var loading = false
    @Published var error: String?

    init() { config = .load() }

    var client: BridgeClient { BridgeClient(config: config) }

    func saveConfig(_ new: AppConfig) {
        config = new
        new.save()
    }

    func refresh() async {
        guard config.isComplete else { return }
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
                if model.config.isComplete {
                    ProjectListView(model: model)
                } else {
                    ContentUnavailableCompat(
                        title: "연결 설정이 필요합니다",
                        message: "Mac Bridge 주소와 기기 토큰을 입력하세요.",
                        button: "연결 설정",
                        action: { showSettings = true }
                    )
                }
            }
            .navigationTitle("Vibex")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button { showSettings = true } label: { Image(systemName: "gear") }
                }
            }
            .sheet(isPresented: $showSettings) { SettingsView(model: model) }
            .task { await model.refresh() }
        }
    }
}

// MARK: - 연결 설정

struct SettingsView: View {
    @ObservedObject var model: AppModel
    @Environment(\.dismiss) private var dismiss
    @State private var baseURL: String = ""
    @State private var token: String = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Bridge 주소") {
                    TextField("http://100.x.x.x:8000", text: $baseURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                }
                Section("기기 토큰") {
                    SecureField("BRIDGE_DEVICE_TOKEN", text: $token)
                }
            }
            .navigationTitle("연결 설정")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("취소") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("저장") {
                        model.saveConfig(AppConfig(baseURL: baseURL, deviceToken: token))
                        dismiss()
                        Task { await model.refresh() }
                    }
                    .disabled(baseURL.isEmpty || token.isEmpty)
                }
            }
            .onAppear {
                baseURL = model.config.baseURL
                token = model.config.deviceToken
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
                NavigationLink(value: project) {
                    HStack {
                        Circle().fill(color(for: project.status)).frame(width: 10, height: 10)
                        VStack(alignment: .leading) {
                            Text(project.displayName).font(.body)
                            if let reason = project.reason {
                                Text(reason).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                        Spacer()
                        Text(label(for: project.status)).font(.caption).foregroundStyle(.secondary)
                    }
                }
                .disabled(project.status == .unavailable)
            }
        }
        .overlay { if model.projects.isEmpty && !model.loading { Text("등록된 프로젝트가 없습니다.").foregroundStyle(.secondary) } }
        .refreshable { await model.refresh() }
        .navigationDestination(for: Project.self) { project in
            ComposeView(model: model, project: project)
        }
    }

    private func color(for status: ProjectStatus) -> Color {
        switch status {
        case .idle: return .green
        case .busy: return .orange
        case .unavailable: return .gray
        }
    }
    private func label(for status: ProjectStatus) -> String {
        switch status {
        case .idle: return "대기"
        case .busy: return "작업 중"
        case .unavailable: return "사용 불가"
        }
    }
}

// MARK: - 스크린샷 선택 → 캔버스

struct ComposeView: View {
    @ObservedObject var model: AppModel
    let project: Project

    @State private var pickerItem: PhotosPickerItem?
    @State private var screenshot: UIImage?
    @State private var presented: PresentedTask?
    @State private var sendError: String?

    var body: some View {
        Group {
            if let screenshot {
                AnnotationCanvasView(screenshot: screenshot) { canvasImage, baseImage in
                    submit(canvasImage: canvasImage, baseImage: baseImage)
                }
            } else {
                VStack(spacing: 16) {
                    Text("수정할 화면의 스크린샷을 고르세요.").foregroundStyle(.secondary)
                    PhotosPicker("스크린샷 선택", selection: $pickerItem, matching: .images)
                        .buttonStyle(.borderedProminent)
                    if let sendError { Text(sendError).foregroundStyle(.red).font(.footnote) }
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
        .sheet(item: $presented) { task in
            TaskStatusView(model: model, taskId: task.id)
        }
    }

    private func submit(canvasImage: Data, baseImage: Data) {
        Task {
            do {
                let created = try await model.client.submitDrawing(
                    projectId: project.projectId, canvasImage: canvasImage, baseImage: baseImage
                )
                presented = PresentedTask(id: created.taskId)
            } catch {
                sendError = error.localizedDescription
            }
        }
    }
}

struct PresentedTask: Identifiable { let id: String }

// MARK: - 작업 상태 (폴링 + 승인 + 질문 응답)

struct TaskStatusView: View {
    @ObservedObject var model: AppModel
    let taskId: String

    @State private var task: AgentTask?
    @State private var error: String?

    var body: some View {
        NavigationStack {
            List {
                if let task {
                    Section("상태") { Text(statusLabel(task.status)) }

                    if let summary = task.summary, !summary.isEmpty {
                        Section("요약") { Text(summary) }
                    }
                    if task.needsConfirmation, let c = task.interpretation {
                        Section("해석 결과") {
                            if let s = c.summary { Text(s) }
                            if let conf = c.overallConfidence {
                                Text("신뢰도 \(Int(conf * 100))%").font(.caption).foregroundStyle(.secondary)
                            }
                            HStack {
                                Button("승인") { act { try await model.client.confirm(taskId: taskId, approved: true) } }
                                    .buttonStyle(.borderedProminent)
                                Button("취소", role: .destructive) {
                                    act { try await model.client.confirm(taskId: taskId, approved: false) }
                                }
                            }
                        }
                    }
                    if task.needsAnswer {
                        ForEach(task.questions) { q in
                            Section(q.text) {
                                ForEach(q.options, id: \.optionId) { opt in
                                    Button(opt.label) {
                                        act {
                                            try await model.client.answer(
                                                taskId: taskId, questionId: q.questionId,
                                                selectedOptionId: opt.optionId
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
                                    if !f.summary.isEmpty { Text(f.summary).font(.caption).foregroundStyle(.secondary) }
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
                    if let err = task.error { Section("오류") { Text(err).foregroundStyle(.red) } }
                } else if let error {
                    Text(error).foregroundStyle(.red)
                } else {
                    ProgressView("불러오는 중…")
                }
            }
            .navigationTitle("작업")
            .task(id: taskId) { await poll() }
        }
    }

    // 끝날 때까지 폴링. 끊겨도 다시 열면 이어진다.
    private func poll() async {
        while !Swift.Task.isCancelled {
            do {
                let t = try await model.client.getTask(taskId)
                task = t
                if !t.status.isActive { break }
            } catch {
                self.error = error.localizedDescription
                break
            }
            try? await Swift.Task.sleep(nanoseconds: 1_500_000_000)
        }
    }

    /// 승인·응답 액션 실행 후 폴링을 다시 태운다.
    private func act(_ work: @escaping () async throws -> Any) {
        Swift.Task {
            do { _ = try await work(); await poll() }
            catch { self.error = error.localizedDescription }
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

// MARK: - 빈 상태 (iOS 16 호환)

struct ContentUnavailableCompat: View {
    let title: String
    let message: String
    let button: String
    let action: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "antenna.radiowaves.left.and.right.slash")
                .font(.largeTitle).foregroundStyle(.secondary)
            Text(title).font(.headline)
            Text(message).font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)
            Button(button, action: action).buttonStyle(.borderedProminent).padding(.top, 4)
        }
        .padding()
    }
}
