import PencilKit
import SwiftUI

// MARK: - 새 프로젝트 드로우코딩 문서

enum BlueprintSectionKind: String, CaseIterable, Identifiable {
    case interface
    case workflow
    case notes
    case custom

    var id: String { rawValue }
    var title: String {
        switch self {
        case .interface: return "UI · 레이아웃"
        case .workflow: return "워크플로 차트"
        case .notes: return "기타 특이사항"
        case .custom: return "새 페이지"
        }
    }
    var purpose: String {
        switch self {
        case .interface: return "화면, 컴포넌트, 배치와 반응형 동작을 그려 주세요."
        case .workflow: return "사용자 행동과 화면·데이터의 흐름을 연결해 주세요."
        case .notes: return "기술 제약, 분위기, 우선순위와 예외를 적어 주세요."
        case .custom: return "추가로 전달할 내용을 자유롭게 그려 주세요."
        }
    }
    var symbol: String {
        switch self {
        case .interface: return "rectangle.3.group"
        case .workflow: return "point.3.connected.trianglepath.dotted"
        case .notes: return "note.text"
        case .custom: return "doc"
        }
    }
}

enum BlueprintPaper: String, CaseIterable, Identifiable {
    case grid, dots, blank
    var id: String { rawValue }
    var label: String {
        switch self {
        case .grid: return "격자"
        case .dots: return "점"
        case .blank: return "무지"
        }
    }
}

@MainActor
final class BlueprintPageDraft: ObservableObject, Identifiable {
    let id: UUID
    let canvasView: PKCanvasView
    @Published var kind: BlueprintSectionKind
    @Published var title: String
    @Published var purpose: String
    @Published var note = ""
    @Published var paper: BlueprintPaper

    init(kind: BlueprintSectionKind, paper: BlueprintPaper? = nil) {
        id = UUID()
        self.kind = kind
        title = kind.title
        purpose = kind.purpose
        self.paper = paper ?? (kind == .workflow ? .grid : .dots)
        canvasView = PencilPassthroughCanvasView()
    }

    init(copying source: BlueprintPageDraft) {
        id = UUID()
        kind = source.kind
        title = "\(source.title) 복사본"
        purpose = source.purpose
        note = source.note
        paper = source.paper
        canvasView = PencilPassthroughCanvasView()
        canvasView.drawing = source.canvasView.drawing
    }
}

// MARK: - 프로젝트 내부 통합 작업공간

private struct StoredBlueprintPage: Codable {
    let kind: String
    let title: String
    let purpose: String
    let note: String
    let paper: String
    let drawing: Data
}

/// 한 프로젝트의 UI·워크플로·특이사항을 하나의 문서 묶음으로 보관한다.
/// 프로젝트 목록을 종류별로 쪼개지 않고, 프로젝트 안에서 전환해 작업한다.
@MainActor
private final class ProjectBlueprintWorkspace: ObservableObject {
    @Published private(set) var pages: [BlueprintPageDraft]
    private let storageKey: String

    init(projectId: String) {
        storageKey = "vibex.project-blueprint.\(projectId)"
        if let data = UserDefaults.standard.data(forKey: storageKey),
           let stored = try? JSONDecoder().decode([StoredBlueprintPage].self, from: data) {
            pages = stored.compactMap(Self.restore)
        } else {
            pages = []
        }
        Self.ensureDefaultPages(in: &pages)
    }

    func page(for kind: BlueprintSectionKind) -> BlueprintPageDraft {
        if let page = pages.first(where: { $0.kind == kind }) { return page }
        let page = BlueprintPageDraft(kind: kind)
        pages.append(page)
        return page
    }

    func save() {
        let stored = pages.map {
            StoredBlueprintPage(
                kind: $0.kind.rawValue,
                title: $0.title,
                purpose: $0.purpose,
                note: $0.note,
                paper: $0.paper.rawValue,
                drawing: $0.canvasView.drawing.dataRepresentation()
            )
        }
        guard let data = try? JSONEncoder().encode(stored) else { return }
        UserDefaults.standard.set(data, forKey: storageKey)
    }

    @discardableResult
    func add(_ kind: BlueprintSectionKind) -> BlueprintPageDraft {
        let page = BlueprintPageDraft(kind: kind)
        pages.append(page)
        save()
        return page
    }

    @discardableResult
    func duplicate(_ source: BlueprintPageDraft) -> BlueprintPageDraft {
        let copy = BlueprintPageDraft(copying: source)
        let index = pages.firstIndex { $0.id == source.id }.map { $0 + 1 } ?? pages.endIndex
        pages.insert(copy, at: index)
        save()
        return copy
    }

    func delete(_ page: BlueprintPageDraft) {
        guard pages.count > 1,
              let index = pages.firstIndex(where: { $0.id == page.id }) else { return }
        pages.remove(at: index)
        save()
    }

    private static func restore(_ stored: StoredBlueprintPage) -> BlueprintPageDraft? {
        guard let kind = BlueprintSectionKind(rawValue: stored.kind),
              let paper = BlueprintPaper(rawValue: stored.paper) else { return nil }
        let page = BlueprintPageDraft(kind: kind, paper: paper)
        page.title = stored.title
        page.purpose = stored.purpose
        page.note = stored.note
        if let drawing = try? PKDrawing(data: stored.drawing) {
            page.canvasView.drawing = drawing
        }
        return page
    }

    private static func ensureDefaultPages(in pages: inout [BlueprintPageDraft]) {
        for kind in [BlueprintSectionKind.interface, .workflow, .notes]
        where !pages.contains(where: { $0.kind == kind }) {
            pages.append(BlueprintPageDraft(kind: kind))
        }
    }
}

struct ProjectWorkspaceView: View {
    @ObservedObject var model: AppModel
    let project: ProjectView

    @Environment(\.displayScale) private var displayScale
    @StateObject private var blueprint: ProjectBlueprintWorkspace
    @State private var selectedPageId: UUID?
    @State private var previewEnabled = false
    @State private var tool = DrawTool()
    @State private var selectedAgentId = ""
    @State private var sending = false
    @State private var createdTask: TaskCreated?
    @State private var errorText: String?

    init(model: AppModel, project: ProjectView) {
        self.model = model
        self.project = project
        _blueprint = StateObject(
            wrappedValue: ProjectBlueprintWorkspace(projectId: project.projectId)
        )
    }

    var body: some View {
        VStack(spacing: 0) {
            if selectedPage?.kind == .interface {
                HStack(spacing: 10) {
                    Image(systemName: previewEnabled ? "rectangle.on.rectangle" : "doc")
                        .foregroundStyle(.tint)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(previewEnabled ? "PC 프리뷰 위에 그리기" : "빈 캔버스에서 설계")
                            .font(.subheadline.weight(.semibold))
                        Text(previewEnabled
                             ? "실제로 실행 중인 프론트엔드에 주석을 남깁니다."
                             : "이면지처럼 자유롭게 화면 아이디어를 그립니다.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Toggle("프리뷰", isOn: $previewEnabled)
                        .labelsHidden()
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 8)
                .background(Color(uiColor: .secondarySystemBackground))
            }

            Divider()

            BlueprintDocumentEditor(
                pages: blueprint.pages,
                selectedPageId: $selectedPageId,
                tool: $tool,
                alternateMain: previewEnabled && selectedPage?.kind == .interface
                    ? AnyView(ProjectLivePreviewView(
                        model: model,
                        project: project,
                        agentId: effectiveAgentId
                    ))
                    : nil,
                onAdd: { kind in blueprint.add(kind) },
                onDuplicate: { page in
                    let copy = blueprint.duplicate(page)
                    selectedPageId = copy.id
                },
                onDelete: { page in
                    blueprint.delete(page)
                    if !blueprint.pages.contains(where: { $0.id == selectedPageId }) {
                        selectedPageId = blueprint.pages.first?.id
                    }
                }
            )
        }
        .navigationTitle(project.displayName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                NavigationLink {
                    ConversationListView(model: model, project: project)
                } label: {
                    Label("대화 내역", systemImage: "bubble.left.and.bubble.right")
                }

                Menu {
                    ForEach(model.agents) { agent in
                        Button {
                            selectedAgentId = agent.agentId
                        } label: {
                            if effectiveAgentId == agent.agentId {
                                Label(agent.displayName, systemImage: "checkmark")
                            } else {
                                Text(agent.displayName)
                            }
                        }
                    }
                } label: {
                    Label(agentName, systemImage: "sparkles")
                }

                if !previewEnabled {
                    Button {
                        blueprint.save()
                    } label: {
                        Label("저장", systemImage: "square.and.arrow.down")
                    }

                    Button {
                        Task { await sendBlueprint() }
                    } label: {
                        if sending { ProgressView() }
                        else { Label("AI에게 전달", systemImage: "paperplane.fill") }
                    }
                    .disabled(sending)
                }
            }
        }
        .sheet(item: $createdTask) { task in
            TaskStatusView(model: model, taskId: task.taskId)
        }
        .alert(
            "설계 문서를 보내지 못했습니다",
            isPresented: Binding(
                get: { errorText != nil },
                set: { if !$0 { errorText = nil } }
            )
        ) {
            Button("확인", role: .cancel) {}
        } message: {
            Text(errorText ?? "")
        }
        .onAppear {
            if selectedAgentId.isEmpty { selectedAgentId = project.agent }
            if selectedPageId == nil { selectedPageId = blueprint.pages.first?.id }
        }
        .onChange(of: selectedPageId) { _ in
            if selectedPage?.kind != .interface { previewEnabled = false }
            blueprint.save()
        }
        .onDisappear { blueprint.save() }
    }

    private var selectedPage: BlueprintPageDraft? {
        blueprint.pages.first(where: { $0.id == selectedPageId }) ?? blueprint.pages.first
    }

    private var effectiveAgentId: String {
        selectedAgentId.isEmpty ? project.agent : selectedAgentId
    }

    private var agentName: String {
        model.agents.first(where: { $0.agentId == effectiveAgentId })?.displayName
            ?? (effectiveAgentId == "codex-cli" ? "Codex" : "Claude Code")
    }

    private func sendBlueprint() async {
        guard !sending else { return }
        sending = true
        defer { sending = false }
        do {
            blueprint.save()
            let exports = blueprint.pages.map { page in
                CanvasComposer.BlueprintPage(
                    title: page.title,
                    purpose: page.purpose,
                    note: page.note,
                    template: page.paper.rawValue,
                    drawing: page.canvasView.drawing,
                    canvasBounds: page.canvasView.bounds
                )
            }
            guard let snapshot = CanvasComposer.blueprintSnapshot(
                pages: exports,
                displayScale: displayScale
            ) else {
                throw BridgeError(message: "프로젝트 설계 문서를 이미지로 만들지 못했습니다.", statusCode: nil)
            }
            let conversations = try await model.client.conversations(projectId: project.projectId)
            let conversation: ConversationView
            if let existing = conversations.first {
                conversation = existing
            } else {
                conversation = try await model.client.createConversation(projectId: project.projectId)
            }
            let task = try await model.client.createTask(
                projectId: project.projectId,
                snapshot: snapshot,
                typedNote: projectBlueprintPrompt,
                clientTaskId: UUID().uuidString,
                conversationId: conversation.conversationId,
                agentId: effectiveAgentId
            )
            createdTask = task
            errorText = nil
        } catch {
            errorText = error.localizedDescription
        }
    }

    private var projectBlueprintPrompt: String {
        let details = blueprint.pages.enumerated().map { index, page in
            "\(index + 1). \(page.title)"
        }.joined(separator: "\n")
        return """
        ‘\(project.displayName)’ 프로젝트 안에서 작성한 통합 설계 문서입니다. UI·레이아웃, 워크플로와 기타사항을 서로 분리된 프로젝트로 취급하지 말고 하나의 제품 맥락으로 함께 반영해 주세요.

        문서 구성:
        \(details)
        """
    }
}

/// UI·레이아웃 탭에서만 켤 수 있는 실제 PC 프론트엔드 작업면.
/// 기존 대화가 있으면 이어 쓰고, 없을 때만 프로젝트 공용 대화를 하나 만든다.
private struct ProjectLivePreviewView: View {
    @ObservedObject var model: AppModel
    let project: ProjectView
    let agentId: String

    @State private var conversationId: String?
    @State private var loading = false
    @State private var errorText: String?

    var body: some View {
        Group {
            if let conversationId {
                ComposeView(
                    model: model,
                    project: project,
                    conversationId: conversationId,
                    agentId: agentId
                )
            } else {
                VStack(spacing: 14) {
                    if loading { ProgressView("대화와 프리뷰를 준비하는 중…") }
                    if let errorText {
                        Text(errorText).foregroundStyle(.red).multilineTextAlignment(.center)
                    }
                    if !loading {
                        Button("다시 시도") { Task { await resolveConversation() } }
                            .buttonStyle(.borderedProminent)
                    }
                }
                .padding()
            }
        }
        .task(id: project.projectId) { await resolveConversation() }
    }

    private func resolveConversation() async {
        guard conversationId == nil, !loading else { return }
        loading = true
        defer { loading = false }
        do {
            let conversations = try await model.client.conversations(projectId: project.projectId)
            if let existing = conversations.first {
                conversationId = existing.conversationId
            } else {
                let created = try await model.client.createConversation(
                    projectId: project.projectId
                )
                conversationId = created.conversationId
            }
            errorText = nil
        } catch {
            errorText = error.localizedDescription
        }
    }
}

struct NewProjectFlowView: View {
    @ObservedObject var model: AppModel
    var onCreated: (ProjectView) -> Void = { _ in }

    @Environment(\.dismiss) private var dismiss
    @Environment(\.displayScale) private var displayScale

    @State private var name = ""
    @State private var selectedAgentId = ""
    @State private var started = false
    @State private var pages = [
        BlueprintPageDraft(kind: .interface),
        BlueprintPageDraft(kind: .workflow),
        BlueprintPageDraft(kind: .notes),
    ]
    @State private var selectedPageId: UUID?
    @State private var tool = DrawTool()
    @State private var creating = false
    @State private var provisionedProject: ProjectView?
    @State private var provisionedConversationId: String?
    @State private var createdTask: TaskCreated?
    @State private var errorText: String?

    var body: some View {
        NavigationStack {
            Group {
                if started {
                    blueprintEditor
                } else {
                    projectSetup
                }
            }
            .navigationTitle(started ? name : "새 프로젝트")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(started ? "뒤로" : "취소") {
                        if started { started = false } else { dismiss() }
                    }
                }
                if started {
                    ToolbarItem(placement: .confirmationAction) {
                        Button {
                            Task { await createAndSend() }
                        } label: {
                            if creating { ProgressView() }
                            else { Label("구현 시작", systemImage: "paperplane.fill") }
                        }
                        .disabled(creating)
                    }
                }
            }
        }
        .frame(minWidth: 760, minHeight: 620)
        .sheet(item: $createdTask) { task in
            TaskStatusView(model: model, taskId: task.taskId)
        }
        .alert(
            "프로젝트를 만들지 못했습니다",
            isPresented: Binding(
                get: { errorText != nil },
                set: { if !$0 { errorText = nil } }
            )
        ) {
            Button("확인", role: .cancel) {}
        } message: {
            Text(errorText ?? "")
        }
        .onAppear {
            if selectedAgentId.isEmpty {
                selectedAgentId = model.agents.first?.agentId ?? "claude-code"
            }
            if selectedPageId == nil { selectedPageId = pages.first?.id }
        }
    }

    private var projectSetup: some View {
        Form {
            Section {
                TextField("예: 여행 일정 플래너", text: $name)
                    .textInputAutocapitalization(.words)
                Picker("첫 작업 에이전트", selection: $selectedAgentId) {
                    ForEach(model.agents) { agent in
                        Text(agent.displayName).tag(agent.agentId)
                    }
                }
            } header: {
                Text("프로젝트")
            } footer: {
                Text("PC의 VIBEX 작업 루트에 같은 이름의 Git 프로젝트가 생성됩니다.")
            }

            Section("드로우코딩 문서") {
                blueprintFeature(
                    "UI · 레이아웃",
                    "화면 구조와 컴포넌트 배치",
                    "rectangle.3.group"
                )
                blueprintFeature(
                    "워크플로 차트",
                    "사용자 행동과 데이터 흐름",
                    "point.3.connected.trianglepath.dotted"
                )
                blueprintFeature(
                    "기타 특이사항",
                    "제약·분위기·우선순위·예외",
                    "note.text"
                )
            }

            Section {
                Button {
                    selectedPageId = pages.first?.id
                    started = true
                } label: {
                    Label("빈 문서에서 설계 시작", systemImage: "pencil.and.outline")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
    }

    private func blueprintFeature(_ title: String, _ subtitle: String, _ symbol: String) -> some View {
        Label {
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.headline)
                Text(subtitle).font(.caption).foregroundStyle(.secondary)
            }
        } icon: {
            Image(systemName: symbol).foregroundStyle(.tint)
        }
    }

    private var blueprintEditor: some View {
        BlueprintDocumentEditor(
            pages: pages,
            selectedPageId: $selectedPageId,
            tool: $tool,
            onAdd: { kind in
                let page = BlueprintPageDraft(kind: kind)
                pages.append(page)
                return page
            },
            onDuplicate: duplicate,
            onDelete: delete
        )
    }

    private var selectedPage: BlueprintPageDraft? {
        pages.first { $0.id == selectedPageId } ?? pages.first
    }

    private func duplicate(_ page: BlueprintPageDraft) {
        let copy = BlueprintPageDraft(copying: page)
        let index = pages.firstIndex { $0.id == page.id }.map { $0 + 1 } ?? pages.endIndex
        pages.insert(copy, at: index)
        selectedPageId = copy.id
    }

    private func delete(_ page: BlueprintPageDraft) {
        guard pages.count > 1, let index = pages.firstIndex(where: { $0.id == page.id }) else { return }
        pages.remove(at: index)
        selectedPageId = pages[min(index, pages.count - 1)].id
    }

    private func createAndSend() async {
        let displayName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !displayName.isEmpty, !creating else { return }
        creating = true
        defer { creating = false }
        do {
            let project: ProjectView
            if let provisionedProject {
                project = provisionedProject
            } else {
                project = try await model.client.createProject(
                    displayName: displayName,
                    agentId: selectedAgentId
                )
                provisionedProject = project
                onCreated(project)
            }

            let conversationId: String
            if let provisionedConversationId {
                conversationId = provisionedConversationId
            } else {
                let conversation = try await model.client.createConversation(projectId: project.projectId)
                conversationId = conversation.conversationId
                provisionedConversationId = conversationId
            }
            let exports = pages.map { page in
                CanvasComposer.BlueprintPage(
                    title: page.title,
                    purpose: page.purpose,
                    note: page.note,
                    template: page.paper.rawValue,
                    drawing: page.canvasView.drawing,
                    canvasBounds: page.canvasView.bounds
                )
            }
            guard let snapshot = CanvasComposer.blueprintSnapshot(
                pages: exports,
                displayScale: displayScale
            ) else {
                throw BridgeError(message: "드로우코딩 문서를 이미지로 만들지 못했습니다.", statusCode: nil)
            }
            let prompt = blueprintPrompt(projectName: displayName)
            let task = try await model.client.createTask(
                projectId: project.projectId,
                snapshot: snapshot,
                typedNote: prompt,
                clientTaskId: UUID().uuidString,
                conversationId: conversationId,
                agentId: selectedAgentId,
                latencyOptimized: false
            )
            createdTask = task
        } catch {
            errorText = error.localizedDescription
        }
    }

    private func blueprintPrompt(projectName: String) -> String {
        let details = pages.enumerated().map { index, page in
            "\(index + 1). \(page.title)"
        }.joined(separator: "\n")
        return """
        새 프로젝트 ‘\(projectName)’의 첫 구현 작업입니다. 첨부된 드로우코딩 문서의 각 페이지를 하나의 제품 설계로 해석해 실제 실행 가능한 프로젝트를 구성해 주세요.

        페이지 설명:
        \(details)

        UI·레이아웃, 워크플로, 기타 제약을 함께 반영하고, 모호해서 구현 방향이 크게 갈리는 부분만 iPad 선택지로 되물어 주세요. 적절한 기술 스택과 실행·테스트 명령은 프로젝트 목적에 맞게 정하세요.
        """
    }
}

private struct BlueprintDocumentEditor: View {
    let pages: [BlueprintPageDraft]
    @Binding var selectedPageId: UUID?
    @Binding var tool: DrawTool
    var alternateMain: AnyView? = nil
    let onAdd: (BlueprintSectionKind) -> BlueprintPageDraft
    let onDuplicate: (BlueprintPageDraft) -> Void
    let onDelete: (BlueprintPageDraft) -> Void

    @State private var settledZoom: CGFloat = 1
    @GestureState private var gestureZoom: CGFloat = 1

    private var selectedPage: BlueprintPageDraft? {
        pages.first(where: { $0.id == selectedPageId }) ?? pages.first
    }

    private var zoom: CGFloat {
        min(3, max(0.5, settledZoom * gestureZoom))
    }

    var body: some View {
        ScrollViewReader { proxy in
            HStack(spacing: 0) {
                VStack(spacing: 8) {
                    if alternateMain == nil {
                        documentControls
                        DrawingToolbar(tool: $tool)
                    }
                    Group {
                        if let alternateMain {
                            alternateMain
                        } else {
                            continuousPages
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }

                Divider()

                BlueprintPageRail(
                    pages: pages,
                    selectedPageId: selectedPageId,
                    onSelect: { page in
                        selectedPageId = page.id
                        withAnimation(.easeInOut(duration: 0.25)) {
                            proxy.scrollTo(page.id, anchor: .top)
                        }
                    },
                    onAdd: { kind in
                        let page = onAdd(kind)
                        selectedPageId = page.id
                        DispatchQueue.main.async {
                            withAnimation { proxy.scrollTo(page.id, anchor: .top) }
                        }
                    },
                    onDuplicate: onDuplicate,
                    onDelete: onDelete
                )
                .frame(width: 220)
                .background(Color(uiColor: .secondarySystemBackground))
            }
        }
        .background(Color(uiColor: .systemGroupedBackground))
    }

    private var documentControls: some View {
        HStack(spacing: 10) {
            Button { selectedPage?.canvasView.undoManager?.undo() } label: {
                Image(systemName: "arrow.uturn.backward")
            }
            .accessibilityLabel("되돌리기")
            Button { selectedPage?.canvasView.undoManager?.redo() } label: {
                Image(systemName: "arrow.uturn.forward")
            }
            .accessibilityLabel("다시하기")
            Button {
                selectedPage?.canvasView.setDrawingUndoably(PKDrawing(), actionName: "페이지 지우기")
            } label: {
                Image(systemName: "trash")
            }
            .accessibilityLabel("페이지 내용 지우기")
            Spacer()
            if let selectedPage {
                Picker(
                    "종이",
                    selection: Binding(
                        get: { selectedPage.paper },
                        set: { selectedPage.paper = $0 }
                    )
                ) {
                    ForEach(BlueprintPaper.allCases) { paper in
                        Text(paper.label).tag(paper)
                    }
                }
                .pickerStyle(.segmented)
                .frame(width: 210)
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
    }

    private var continuousPages: some View {
        GeometryReader { geometry in
            let pageWidth = max(680, geometry.size.width - 32)
            let pageHeight = max(620, pageWidth * 0.72)

            ScrollView([.horizontal, .vertical]) {
                LazyVStack(spacing: 24) {
                    ForEach(Array(pages.enumerated()), id: \.element.id) { index, page in
                        BlueprintDocumentPage(
                            page: page,
                            pageNumber: index + 1,
                            tool: tool
                        )
                        .frame(width: pageWidth, height: pageHeight)
                        .scaleEffect(zoom, anchor: .topLeading)
                        .frame(
                            width: pageWidth * zoom,
                            height: pageHeight * zoom,
                            alignment: .topLeading
                        )
                        .id(page.id)
                        .onTapGesture { selectedPageId = page.id }
                    }
                }
                .padding(16)
            }
            .simultaneousGesture(
                MagnificationGesture()
                    .updating($gestureZoom) { value, state, _ in state = value }
                    .onEnded { value in
                        settledZoom = min(3, max(0.5, settledZoom * value))
                    }
            )
            .overlay(alignment: .bottomTrailing) {
                Button {
                    withAnimation { settledZoom = 1 }
                } label: {
                    Text("\(Int((zoom * 100).rounded()))%")
                        .font(.caption.monospacedDigit().weight(.semibold))
                }
                .buttonStyle(.bordered)
                .padding(18)
                .accessibilityLabel("확대 비율 초기화")
            }
        }
    }
}

private struct BlueprintDocumentPage: View {
    @ObservedObject var page: BlueprintPageDraft
    let pageNumber: Int
    let tool: DrawTool

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                Image(systemName: page.kind.symbol).foregroundStyle(.tint)
                Text(page.title).font(.title3.bold())
                Spacer()
                Text("\(pageNumber)")
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 18)
            .frame(height: 54)

            Divider()

            ZStack {
                BlueprintPaperView(paper: page.paper)
                PencilCanvas(
                    canvasView: page.canvasView,
                    tool: tool,
                    // 실제 기기에서는 Apple Pencil만 그린다. 모든 손가락 입력은
                    // 바깥 문서 ScrollView의 이동·핀치 확대에 사용한다.
                    allowFingerDrawing: false,
                    isActive: true
                )
            }
        }
        .background(Color(uiColor: .systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(.secondary.opacity(0.3)))
        .shadow(color: .black.opacity(0.08), radius: 8, y: 3)
    }
}

private struct BlueprintPageRail: View {
    let pages: [BlueprintPageDraft]
    let selectedPageId: UUID?
    let onSelect: (BlueprintPageDraft) -> Void
    let onAdd: (BlueprintSectionKind) -> Void
    let onDuplicate: (BlueprintPageDraft) -> Void
    let onDelete: (BlueprintPageDraft) -> Void

    private var selectedPage: BlueprintPageDraft? {
        pages.first(where: { $0.id == selectedPageId }) ?? pages.first
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("페이지").font(.headline)
                Spacer()
                Menu {
                    ForEach(BlueprintSectionKind.allCases) { kind in
                        Button { onAdd(kind) } label: {
                            Label(kind.title, systemImage: kind.symbol)
                        }
                    }
                } label: {
                    Image(systemName: "plus")
                }
            }
            .padding()

            ScrollView {
                LazyVStack(spacing: 10) {
                    ForEach(Array(pages.enumerated()), id: \.element.id) { index, page in
                        Button { onSelect(page) } label: {
                            VStack(alignment: .leading, spacing: 8) {
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Color(uiColor: .systemBackground))
                                    .frame(height: 104)
                                    .overlay {
                                        VStack(spacing: 8) {
                                            Image(systemName: page.kind.symbol).font(.title2)
                                            Text(page.title).font(.caption.weight(.semibold)).lineLimit(2)
                                        }
                                        .foregroundStyle(.secondary)
                                    }
                                    .overlay {
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(
                                                selectedPageId == page.id ? Color.accentColor : .secondary.opacity(0.25),
                                                lineWidth: selectedPageId == page.id ? 2 : 1
                                            )
                                    }
                                HStack {
                                    Text("\(index + 1)").font(.caption.monospacedDigit())
                                    Text(page.title).font(.caption).lineLimit(1)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                        .contextMenu {
                            Button("복제") { onDuplicate(page) }
                            Button("삭제", role: .destructive) { onDelete(page) }
                                .disabled(pages.count == 1)
                        }
                    }
                }
                .padding(.horizontal, 12)
                .padding(.bottom, 12)
            }

            Divider()
            HStack {
                Button { if let selectedPage { onDuplicate(selectedPage) } } label: {
                    Image(systemName: "plus.square.on.square")
                }
                .accessibilityLabel("페이지 복제")
                Spacer()
                Button(role: .destructive) {
                    if let selectedPage { onDelete(selectedPage) }
                } label: {
                    Image(systemName: "trash")
                }
                .disabled(pages.count == 1)
                .accessibilityLabel("페이지 삭제")
            }
            .padding()
        }
    }
}

private struct BlueprintPaperView: View {
    let paper: BlueprintPaper

    var body: some View {
        Canvas { context, size in
            context.fill(Path(CGRect(origin: .zero, size: size)), with: .color(Color(uiColor: .systemBackground)))
            let color = Color.secondary.opacity(0.16)
            switch paper {
            case .grid:
                var path = Path()
                for x in stride(from: 0.0, through: size.width, by: 32) {
                    path.move(to: CGPoint(x: x, y: 0)); path.addLine(to: CGPoint(x: x, y: size.height))
                }
                for y in stride(from: 0.0, through: size.height, by: 32) {
                    path.move(to: CGPoint(x: 0, y: y)); path.addLine(to: CGPoint(x: size.width, y: y))
                }
                context.stroke(path, with: .color(color), lineWidth: 0.8)
            case .dots:
                for x in stride(from: 16.0, to: size.width, by: 28) {
                    for y in stride(from: 16.0, to: size.height, by: 28) {
                        context.fill(Path(ellipseIn: CGRect(x: x - 1, y: y - 1, width: 2, height: 2)), with: .color(color))
                    }
                }
            case .blank:
                break
            }
        }
    }
}
