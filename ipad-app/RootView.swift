import SwiftUI

// 앱 흐름: 목록 → PC 라이브 프론트엔드 → 드로잉 → 작업 상태.

extension TaskCreated: Identifiable {
    var id: String { taskId }
}

extension TaskView: Identifiable {
    var id: String { taskId }
}

@MainActor
final class AppModel: ObservableObject {
    @Published var projects: [ProjectView] = []
    @Published var agents: [AgentView] = []
    @Published var loading = false
    @Published var error: String?

    private var baseURLText: String {
        #if targetEnvironment(simulator)
        return "http://127.0.0.1:8787"
        #else
        return UserDefaults.standard.string(forKey: "bridgeBaseURL") ?? ""
        #endif
    }

    var isConfigured: Bool {
        #if targetEnvironment(simulator)
        return true
        #else
        return !baseURLText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        #endif
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
            async let projectRequest = client.listProjects()
            async let agentRequest = client.listAgents()
            let loadedProjects = try await projectRequest
            let loadedAgents = try await agentRequest
            projects = loadedProjects
            agents = loadedAgents.filter(\.usable)
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
    @State private var showNewProject = false
    @State private var libraryFilter: ProjectLibraryFilter? = .all

    var body: some View {
        NavigationSplitView {
            List(selection: $libraryFilter) {
                Section {
                    Label("모든 프로젝트", systemImage: "square.grid.2x2")
                        .tag(ProjectLibraryFilter.all)
                    Label("최근 작업", systemImage: "clock")
                        .tag(ProjectLibraryFilter.recent)
                    Label("작업 중", systemImage: "bolt.horizontal.circle")
                        .tag(ProjectLibraryFilter.active)
                }
            }
            .navigationTitle("Vibex")
            .listStyle(.sidebar)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button { showSettings = true } label: { Image(systemName: "gear") }
                }
            }
        } detail: {
            NavigationStack {
                if model.isConfigured {
                    ProjectListView(
                        model: model,
                        filter: libraryFilter ?? .all,
                        createProject: { showNewProject = true }
                    )
                } else {
                    NeedsSetupView { showSettings = true }
                }
            }
        }
        .sheet(isPresented: $showSettings, onDismiss: { Task { await model.refresh() } }) {
            SettingsView()
        }
        .fullScreenCover(isPresented: $showNewProject) {
            NewProjectFlowView(model: model) { _ in
                Task { await model.refresh() }
            }
        }
        .task { await model.refresh() }
    }
}

enum ProjectLibraryFilter: String, Hashable {
    case all, recent, active
}

// MARK: - 연결 설정

struct SettingsView: View {
    private enum ConnectionState {
        case checking
        case connected(name: String, projects: Int)
        case failed(String)
    }

    private struct AvailableBridge: Identifiable, Sendable {
        let url: URL
        let name: String
        let projects: Int
        var id: String { url.absoluteString }
    }

    @Environment(\.dismiss) private var dismiss
    @AppStorage("bridgeBaseURL") private var selectedBridgeURL = ""
    @AppStorage("bridgeKnownURLs") private var knownBridgeURLsJSON = "[]"
    @State private var connectionState: ConnectionState = .checking
    @State private var availableBridges: [AvailableBridge] = []
    @State private var manualHost = ""
    @State private var discovering = false

    private var connectionURL: URL? {
        #if targetEnvironment(simulator)
        return URL(string: "http://127.0.0.1:8787")
        #else
        return normalizedBridgeURL(selectedBridgeURL)
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
                    case let .connected(name, projects):
                        Label("\(name)에 연결됨 · 프로젝트 \(projects)개", systemImage: "checkmark.circle.fill")
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
                    if !selectedBridgeURL.isEmpty {
                        Text(selectedBridgeURL)
                            .font(.callout.monospaced()).textSelection(.enabled)
                    }
                    Text("각 PC의 고유 MagicDNS 이름을 유지합니다. 선택한 PC만 이 앱의 연결 대상으로 사용됩니다.")
                        .font(.caption).foregroundStyle(.secondary)
                    #endif

                    Button("다시 확인") {
                        Task { await checkConnection() }
                    }
                }

                #if !targetEnvironment(simulator)
                Section("온라인 VIBEX PC") {
                    if discovering {
                        HStack {
                            ProgressView()
                            Text("tailnet의 VIBEX PC를 확인하는 중…")
                        }
                    } else if availableBridges.isEmpty {
                        Text("발견된 PC가 없습니다. 처음 연결하는 PC라면 아래에서 MagicDNS 이름을 한 번 추가해 주세요.")
                            .font(.footnote).foregroundStyle(.secondary)
                    } else {
                        ForEach(availableBridges) { bridge in
                            Button {
                                select(bridge)
                            } label: {
                                HStack {
                                    Label(bridge.name, systemImage: "desktopcomputer")
                                    Spacer()
                                    Text("프로젝트 \(bridge.projects)개")
                                        .font(.caption).foregroundStyle(.secondary)
                                    if selectedBridgeURL == bridge.url.absoluteString {
                                        Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                                    }
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    Button("온라인 목록 새로고침") {
                        Task { await discoverAvailableBridges() }
                    }
                }

                Section {
                    TextField("예: joonsu-imac 또는 전체 MagicDNS 주소", text: $manualHost)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    Button("연결하고 목록에 추가") {
                        Task { await addManualBridge() }
                    }
                    .disabled(manualHost.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                } header: {
                    Text("PC 직접 추가")
                } footer: {
                    Text("Tailscale 앱의 기기 목록에 표시되는 이름을 입력하면 됩니다. 포트를 생략하면 8788을 사용합니다.")
                }
                #endif

            }
            .navigationTitle("연결 설정")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("완료") { dismiss() } }
            }
            .task { await prepareConnections() }
        }
    }

    private func checkConnection() async {
        guard let connectionURL else {
            connectionState = .failed("연결할 PC를 선택하거나 MagicDNS 이름을 추가해 주세요.")
            return
        }
        connectionState = .checking
        do {
            let health = try await BridgeClient(baseURL: connectionURL).health()
            guard health.status == "ok" else {
                connectionState = .failed("Vibex 백엔드가 정상 상태를 반환하지 않았습니다.")
                return
            }
            remember(connectionURL)
            connectionState = .connected(
                name: connectionURL.host ?? connectionURL.absoluteString,
                projects: health.projects
            )
        } catch {
            connectionState = .failed(error.localizedDescription)
        }
    }

    private func prepareConnections() async {
        await discoverAvailableBridges()
        await checkConnection()
    }

    private func select(_ bridge: AvailableBridge) {
        selectedBridgeURL = bridge.url.absoluteString
        Task { await checkConnection() }
    }

    private func addManualBridge() async {
        guard let url = normalizedBridgeURL(manualHost) else {
            connectionState = .failed("MagicDNS 이름 또는 주소 형식이 올바르지 않습니다.")
            return
        }
        selectedBridgeURL = url.absoluteString
        remember(url)
        manualHost = ""
        await checkConnection()
        await discoverAvailableBridges()
    }

    private func discoverAvailableBridges() async {
        guard !discovering else { return }
        discovering = true
        defer { discovering = false }

        var urls = knownBridgeURLs.compactMap(normalizedBridgeURL)
        if let selected = normalizedBridgeURL(selectedBridgeURL) { urls.append(selected) }
        // 시뮬레이터도 로컬 Bridge를 discovery 기준점으로 사용한다. 이전에는
        // 여기서 즉시 반환하여 온라인 PC 목록이 절대로 표시되지 않았다.
        if let connectionURL { urls.append(connectionURL) }
        urls = unique(urls)

        // 기억된 PC 중 하나만 살아 있어도 그 Bridge를 통해 현재 온라인인
        // tailnet PC 후보를 받아온다. 이후 각 후보의 VIBEX health를 직접 검증한다.
        var discoverySource: URL?
        var online: [AvailableBridge] = []
        for url in urls {
            if let bridge = await probe(url) {
                online.append(bridge)
                discoverySource = discoverySource ?? url
            }
        }
        if let discoverySource,
           let devices = try? await shortClient(discoverySource).tailscaleDevices() {
            urls.append(contentsOf: devices.compactMap(\.bridgeURL))
        }

        online = []
        await withTaskGroup(of: AvailableBridge?.self) { group in
            for url in unique(urls) {
                group.addTask { await probe(url) }
            }
            for await result in group {
                if let result { online.append(result) }
            }
        }
        availableBridges = online.sorted { $0.name.localizedStandardCompare($1.name) == .orderedAscending }
        for bridge in availableBridges { remember(bridge.url) }
    }

    private func probe(_ url: URL) async -> AvailableBridge? {
        guard let health = try? await shortClient(url).health(), health.status == "ok" else {
            return nil
        }
        return AvailableBridge(
            url: url,
            name: url.host?.split(separator: ".").first.map(String.init) ?? url.absoluteString,
            projects: health.projects
        )
    }

    private func shortClient(_ url: URL) -> BridgeClient {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 2.5
        configuration.timeoutIntervalForResource = 3.5
        return BridgeClient(baseURL: url, session: URLSession(configuration: configuration))
    }

    private func normalizedBridgeURL(_ input: String) -> URL? {
        let value = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty else { return nil }
        let candidate = value.contains("://") ? value : "http://\(value)"
        guard var components = URLComponents(string: candidate), components.host != nil else {
            return nil
        }
        if components.scheme == nil { components.scheme = "http" }
        if components.port == nil { components.port = 8788 }
        components.path = ""
        components.query = nil
        components.fragment = nil
        return components.url
    }

    private var knownBridgeURLs: [String] {
        guard let data = knownBridgeURLsJSON.data(using: .utf8),
              let urls = try? JSONDecoder().decode([String].self, from: data) else { return [] }
        return urls
    }

    private func remember(_ url: URL) {
        var urls = knownBridgeURLs
        if !urls.contains(url.absoluteString) { urls.append(url.absoluteString) }
        guard let data = try? JSONEncoder().encode(urls),
              let json = String(data: data, encoding: .utf8) else { return }
        knownBridgeURLsJSON = json
    }

    private func unique(_ urls: [URL]) -> [URL] {
        var seen = Set<String>()
        return urls.filter { seen.insert($0.absoluteString).inserted }
    }
}

// MARK: - 프로젝트 목록

struct ProjectListView: View {
    @ObservedObject var model: AppModel
    let filter: ProjectLibraryFilter
    let createProject: () -> Void
    @State private var searchText = ""

    private var visibleProjects: [ProjectView] {
        let searched = model.projects.filter {
            searchText.isEmpty || $0.displayName.localizedCaseInsensitiveContains(searchText)
        }
        switch filter {
        case .active:
            return searched.filter { $0.status == .busy }
        default:
            return searched
        }
    }

    var body: some View {
        List {
            if let error = model.error {
                Text(error).foregroundStyle(.red).font(.footnote)
            }
            Section {
            ForEach(visibleProjects) { project in
                NavigationLink {
                    ConversationListView(model: model, project: project)
                } label: {
                    HStack(spacing: 14) {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color.accentColor.opacity(0.12))
                            .frame(width: 54, height: 54)
                            .overlay {
                                Image(systemName: "pencil.and.outline")
                                    .font(.title3).foregroundStyle(.tint)
                            }
                        VStack(alignment: .leading, spacing: 5) {
                            Text(project.displayName).font(.headline)
                            if let reason = project.reason {
                                Text(reason).font(.caption).foregroundStyle(.secondary)
                            } else {
                                Text(project.agent == "codex-cli" ? "Codex" : "Claude Code")
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                        }
                        Spacer()
                        Label(label(project.status), systemImage: "circle.fill")
                            .font(.caption)
                            .foregroundStyle(color(project.status))
                    }
                    .padding(.vertical, 5)
                }
                .disabled(project.status == .unavailable)
            }
            } header: {
                Text(sectionTitle)
            }
        }
        .overlay {
            if visibleProjects.isEmpty && !model.loading {
                VStack(spacing: 12) {
                    Image(systemName: "square.and.pencil")
                        .font(.largeTitle).foregroundStyle(.secondary)
                    Text("프로젝트가 없습니다").font(.headline)
                    Text("새 프로젝트를 만들고 화면·워크플로를 Apple Pencil로 설계해 보세요.")
                        .font(.subheadline).foregroundStyle(.secondary)
                    Button("새 프로젝트", action: createProject).buttonStyle(.borderedProminent)
                }
                .multilineTextAlignment(.center)
                .padding()
            }
        }
        .navigationTitle(sectionTitle)
        .searchable(text: $searchText, prompt: "프로젝트 검색")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button(action: createProject) {
                    Label("새 프로젝트", systemImage: "plus")
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .refreshable { await model.refresh() }
    }

    private var sectionTitle: String {
        switch filter {
        case .all: return "모든 프로젝트"
        case .recent: return "최근 작업"
        case .active: return "작업 중"
        }
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

// MARK: - VIBEX 공용 대화

struct ConversationListView: View {
    @ObservedObject var model: AppModel
    let project: ProjectView

    @State private var conversations: [ConversationView] = []
    @State private var loading = false
    @State private var errorText: String?

    var body: some View {
        List {
            if let errorText {
                Text(errorText).foregroundStyle(.red).font(.footnote)
            }
            ForEach(conversations) { conversation in
                NavigationLink {
                    ProjectWorkspaceView(
                        model: model,
                        project: project,
                        conversation: conversation
                    )
                } label: {
                    VStack(alignment: .leading, spacing: 5) {
                        Text(conversation.title).font(.headline)
                        Text(conversation.updatedAt, style: .relative)
                            .font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .overlay {
            if loading { ProgressView() }
            else if conversations.isEmpty { Text("대화가 없습니다.").foregroundStyle(.secondary) }
        }
        .navigationTitle(project.displayName)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button { Task { await createConversation() } } label: {
                    Image(systemName: "square.and.pencil")
                }
                .accessibilityLabel("새 대화")
            }
        }
        .task { await refresh() }
        .refreshable { await refresh() }
    }

    private func refresh() async {
        loading = true
        defer { loading = false }
        do {
            conversations = try await model.client.conversations(projectId: project.projectId)
            errorText = nil
        } catch {
            errorText = error.localizedDescription
        }
    }

    private func createConversation() async {
        loading = true
        defer { loading = false }
        do {
            let created = try await model.client.createConversation(projectId: project.projectId)
            conversations.insert(created, at: 0)
            errorText = nil
        } catch {
            errorText = error.localizedDescription
        }
    }
}

struct ConversationDetailView: View {
    @ObservedObject var model: AppModel
    let project: ProjectView
    let conversation: ConversationView

    @State private var tasks: [TaskView] = []
    @State private var selectedAgentId = ""
    @State private var draft = ""
    @State private var isSending = false
    @State private var errorText: String?

    var body: some View {
        List {
            if let errorText {
                Text(errorText).foregroundStyle(.red).font(.footnote)
            }
            ForEach(tasks) { task in
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Text(task.agentId == "claude-code" ? "Claude" : "Codex")
                            .font(.caption).foregroundStyle(.secondary)
                        Spacer()
                        Text(task.createdAt, style: .time)
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    if !task.userMessage.isEmpty {
                        Text(task.userMessage)
                            .padding(10)
                            .background(.secondary.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
                    }
                    if let reply = task.agentReply, !reply.isEmpty {
                        Text(reply).textSelection(.enabled)
                    } else if task.status.isActive {
                        ProgressView("작업 중…")
                    } else if let error = task.error {
                        Text(error).foregroundStyle(.red)
                    }
                }
                .padding(.vertical, 6)
            }
        }
        .navigationTitle(conversation.title)
        .safeAreaInset(edge: .bottom) {
            VStack(spacing: 10) {
                HStack {
                    Picker("모델", selection: $selectedAgentId) {
                        ForEach(model.agents) { agent in
                            Text(agent.displayName).tag(agent.agentId)
                        }
                    }
                    .pickerStyle(.menu)

                    Spacer()

                }

                HStack(alignment: .bottom) {
                    TextField("메시지 보내기", text: $draft, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(1...5)
                    Button {
                        Task { await sendText() }
                    } label: {
                        if isSending {
                            ProgressView()
                        } else {
                            Image(systemName: "arrow.up.circle.fill")
                                .font(.title2)
                        }
                    }
                    .disabled(
                        isSending || draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                    )
                    .accessibilityLabel("전송")
                }
            }
            .padding()
            .background(.regularMaterial)
        }
        .task {
            if selectedAgentId.isEmpty {
                selectedAgentId = model.agents.first?.agentId ?? project.agent
            }
            while !Task.isCancelled {
                await refresh()
                try? await Task.sleep(for: .seconds(1.5))
            }
        }
        .refreshable { await refresh() }
    }

    private var effectiveAgentId: String {
        selectedAgentId.isEmpty ? project.agent : selectedAgentId
    }

    private func refresh() async {
        do {
            let detail = try await model.client.conversation(
                projectId: project.projectId,
                conversationId: conversation.conversationId
            )
            tasks = detail.tasks
            errorText = nil
        } catch {
            errorText = error.localizedDescription
        }
    }

    private func sendText() async {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !isSending else { return }
        isSending = true
        defer { isSending = false }
        do {
            _ = try await model.client.createTask(
                projectId: project.projectId,
                typedNote: text,
                clientTaskId: UUID().uuidString,
                conversationId: conversation.conversationId,
                agentId: effectiveAgentId
            )
            draft = ""
            errorText = nil
            await refresh()
        } catch {
            errorText = error.localizedDescription
        }
    }
}

// MARK: - PC 라이브 프론트엔드 → 캔버스

struct ComposeView: View {
    @ObservedObject var model: AppModel
    let project: ProjectView
    let conversationId: String
    let agentId: String

    @State private var preview: PreviewView?
    @State private var loading = false
    @State private var errorText: String?

    var body: some View {
        Group {
            if let preview {
                LivePreviewEditorView(
                    model: model,
                    projectId: project.projectId,
                    conversationId: conversationId,
                    agentId: agentId,
                    previewURL: preview.url
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
