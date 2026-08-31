// iPad 앱과 백엔드 사이의 HTTP 통신을 모아 둠
import Foundation

// MARK: - 서버 응답 모델
enum TaskStatus: String, Decodable {
    case queued, interpreting
    case awaitingConfirmation = "awaiting_confirmation"
    case resolvingSession = "resolving_session"
    case runningAgent = "running_agent"
    case testing, completed, failed, cancelled
    var isActive: Bool {
        switch self {
        case .completed, .failed, .cancelled: return false
        default: return true
        }
    }
}

struct TaskCreated: Decodable {
    let taskId: String
    let status: TaskStatus
    let conversationId: String?
}

struct AgentOption: Decodable, Identifiable {
    let value: String
    let label: String
    var id: String { value }
}

struct AgentView: Decodable, Identifiable {
    let agentId: String
    let displayName: String
    let usable: Bool
    let note: String
    let models: [AgentOption]
    var id: String { agentId }
}

struct ConversationView: Decodable, Identifiable {
    let conversationId: String
    let projectId: String
    let title: String
    let createdAt: Date
    let updatedAt: Date
    let agentSessions: [String: String]
    var id: String { conversationId }
}

struct ConversationDetail: Decodable {
    let conversation: ConversationView
    let tasks: [TaskView]
}

struct ProjectView: Decodable, Identifiable {
    enum Status: String, Decodable { case idle, busy, unavailable }

    let projectId: String
    let displayName: String
    let status: Status
    let activeTaskId: String?
    let reason: String?
    let agent: String
    let previewAvailable: Bool

    var id: String { projectId }
}

struct ChangedFile: Decodable { let path: String; let summary: String }
struct TestResult: Decodable { let command: String; let status: String; let summary: String }
struct QuestionOption: Decodable, Identifiable {
    let optionId: String
    let label: String
    var id: String { optionId }
}
struct OverlayTarget: Decodable {
    let shape: String
    let x: Double
    let y: Double
    let width: Double
    let height: Double
    let label: String
}
struct Question: Decodable, Identifiable {
    let questionId: String
    let text: String
    let options: [QuestionOption]
    let overlay: OverlayTarget?
    var id: String { questionId }
}

struct PreviewView: Decodable {
    let projectId: String
    let url: URL
    let port: Int
}

struct HealthView: Decodable {
    let status: String
    let projects: Int
}

struct TailscaleDeviceView: Decodable, Identifiable {
    let name: String
    let dnsName: String
    let online: Bool
    let isSelf: Bool

    var id: String { dnsName }
    var bridgeURL: URL? { URL(string: "http://\(dnsName):8787") }
}

struct TaskView: Decodable {
    let taskId: String
    let projectId: String
    let conversationId: String?
    let status: TaskStatus
    let sessionId: String?
    let agentId: String?
    let agentModel: String?
    let userMessage: String
    let createdAt: Date
    let updatedAt: Date
    let summary: String?
    let agentReply: String?
    let changedFiles: [ChangedFile]
    let testResults: [TestResult]
    let questions: [Question]
    let warnings: [String]
    let error: String?
}

// MARK: - 오류

struct BridgeError: LocalizedError {
    let message: String
    let statusCode: Int?

    var errorDescription: String? { message }

    static func network(_ error: Error) -> BridgeError {
        let message: String
        switch (error as? URLError)?.code {
        case .some(.cannotConnectToHost), .some(.cannotFindHost):
            message = "iMac에 연결할 수 없습니다. 브리지 서버가 켜져 있는지 확인해 주세요."
        case .some(.notConnectedToInternet), .some(.networkConnectionLost):
            message = "네트워크 연결이 끊겼습니다. 잠시 후 다시 시도해 주세요."
        case .some(.timedOut):
            message = "iMac이 응답하지 않습니다."
        case .some(.appTransportSecurityRequiresSecureConnection):
            message = "평문 HTTP 연결이 차단되었습니다. Info.plist의 ATS 설정을 확인해 주세요."
        default:
            message = error.localizedDescription
        }
        return BridgeError(message: message, statusCode: nil)
    }
}

private struct ErrorDetail: Decodable { let detail: String? }

// MARK: - 클라이언트

/// PC의 Bridge와 통신
struct BridgeClient {
    let baseURL: URL
    var session: URLSession = .shared

    private static let prefix = "api/v1"

    func health() async throws -> HealthView {
        try await send(request(path: "health"), as: HealthView.self)
    }

    func tailscaleDevices() async throws -> [TailscaleDeviceView] {
        struct Response: Decodable { let devices: [TailscaleDeviceView] }
        return try await send(
            request(path: "tailscale/devices"),
            as: Response.self
        ).devices
    }

    /// 사용자가 연결 확인에 쓴 `/api/v1/health` 주소를 그대로 붙여 넣더라도 API 경로가 중복되지 않게 PC 서버의 루트 URL로 되돌림
    private var serverRootURL: URL {
        guard var components = URLComponents(
            url: baseURL, resolvingAgainstBaseURL: false
        ) else { return baseURL }

        var segments = components.path.split(separator: "/").map(String.init)
        if let apiIndex = segments.indices.first(where: { index in
            segments[index].lowercased() == "api"
                && segments.indices.contains(index + 1)
                && segments[index + 1].lowercased() == "v1"
        }) {
            segments = Array(segments[..<apiIndex])
        }
        components.path = segments.isEmpty ? "" : "/" + segments.joined(separator: "/")
        components.query = nil
        components.fragment = nil
        return components.url ?? baseURL
    }

    // MARK: 프로젝트

    func listProjects() async throws -> [ProjectView] {
        struct Response: Decodable { let projects: [ProjectView] }
        return try await send(request(path: "projects"), as: Response.self).projects
    }

    /// PC의 `BRIDGE_WORKSPACE_ROOT` 아래에 새 Git 프로젝트를 생성
    func createProject(displayName: String, agentId: String) async throws -> ProjectView {
        try await sendJSON(
            path: "projects",
            body: [
                "displayName": displayName,
                "agent": agentId,
            ],
            as: ProjectView.self
        )
    }

    func listAgents() async throws -> [AgentView] {
        struct Response: Decodable { let agents: [AgentView] }
        return try await send(request(path: "agents"), as: Response.self).agents
    }

    func conversations(projectId: String) async throws -> [ConversationView] {
        struct Response: Decodable { let conversations: [ConversationView] }
        return try await send(
            request(path: "projects/\(projectId)/conversations"),
            as: Response.self
        ).conversations
    }

    func createConversation(projectId: String) async throws -> ConversationView {
        try await sendJSON(
            path: "projects/\(projectId)/conversations",
            body: ["title": "새 대화"],
            as: ConversationView.self
        )
    }

    func deleteConversation(
        projectId: String, conversationId: String
    ) async throws -> ConversationView {
        try await send(
            request(
                path: "projects/\(projectId)/conversations/\(conversationId)",
                method: "DELETE"
            ),
            as: ConversationView.self
        )
    }

    func conversation(projectId: String, conversationId: String) async throws -> ConversationDetail {
        try await send(
            request(path: "projects/\(projectId)/conversations/\(conversationId)"),
            as: ConversationDetail.self
        )
    }

    func startPreview(projectId: String) async throws -> PreviewView {
        try await send(
            request(path: "projects/\(projectId)/preview", method: "POST"),
            as: PreviewView.self
        )
    }

    // MARK: 작업

    /// 그림 전송
    ///   - snapshot: 실제 WKWebView 렌더와 그 위의 획을 같은 좌표계로 보냄
    ///   - clientTaskId: 재전송해도 작업이 중복 생성되지 않게 함
    ///     같은 그림을 다시 보낼 땐 같은 값을 유지하도록 함
    func createTask(
        projectId: String,
        snapshot: CanvasComposer.Snapshot,
        typedNote: String? = nil,
        clientTaskId: String,
        conversationId: String? = nil,
        agentId: String? = nil,
        latencyOptimized: Bool = true
    ) async throws -> TaskCreated {
        var fields = [
            "projectId": projectId,
            "clientTaskId": clientTaskId,
            "origin": "ipad",
            "mode": latencyOptimized ? "visual-fast" : "visual-full",
        ]
        // 짧은 UI 수정 피드백은 CLI 기본 설정을 그대로 사용하지 않음
        if latencyOptimized { fields["effort"] = "low" }
        if let conversationId { fields["conversationId"] = conversationId }
        if let agentId { fields["agentId"] = agentId }
        if let typedNote, !typedNote.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            fields["typedNote"] = typedNote
        }

        var files = [(name: "canvasImage", payload: snapshot.canvas)]
        if let base = snapshot.base {
            files.append((name: "renderedViewImage", payload: base))
        }

        let (body, contentType) = Self.multipartBody(fields: fields, files: files)
        var req = request(path: "tasks", method: "POST")
        req.setValue(contentType, forHTTPHeaderField: "Content-Type")
        req.httpBody = body
        return try await send(req, as: TaskCreated.self)
    }

    /// 이미지 없이 텍스트만 전송
    func createTask(
        projectId: String,
        typedNote: String,
        clientTaskId: String,
        conversationId: String? = nil,
        agentId: String? = nil,
        latencyOptimized: Bool = true
    ) async throws -> TaskCreated {
        var fields = [
            "projectId": projectId,
            "clientTaskId": clientTaskId,
            "typedNote": typedNote,
            "origin": "ipad",
        ]
        if latencyOptimized { fields["effort"] = "low" }
        if let conversationId { fields["conversationId"] = conversationId }
        if let agentId { fields["agentId"] = agentId }
        let (body, contentType) = Self.multipartBody(fields: fields, files: [])
        var req = request(path: "tasks", method: "POST")
        req.setValue(contentType, forHTTPHeaderField: "Content-Type")
        req.httpBody = body
        return try await send(req, as: TaskCreated.self)
    }

    func task(_ taskId: String) async throws -> TaskView {
        try await send(request(path: "tasks/\(taskId)"), as: TaskView.self)
    }

    func tasks(projectId: String, limit: Int = 30) async throws -> [TaskView] {
        struct Response: Decodable { let tasks: [TaskView] }
        let req = request(path: "tasks", query: [
            URLQueryItem(name: "projectId", value: projectId),
            URLQueryItem(name: "limit", value: String(limit)),
        ])
        return try await send(req, as: Response.self).tasks
    }

    /// 사용자의 모호한 질문에 대하여 LLM이 되물음 -> 추천 선택지 또는 사용자가 직접 입력한 문장으로 답 가능
    func answer(
        _ taskId: String,
        questionId: String,
        optionId: String? = nil,
        freeText: String? = nil
    ) async throws -> TaskCreated {
        var body: [String: Any] = ["questionId": questionId]
        if let optionId { body["selectedOptionId"] = optionId }
        if let freeText,
           !freeText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            body["freeText"] = freeText
            if optionId == nil { body["selectedOptionId"] = "__free_text__" }
        }
        return try await sendJSON(
            path: "tasks/\(taskId)/answer",
            body: body,
            as: TaskCreated.self
        )
    }

    func cancel(_ taskId: String) async throws -> TaskView {
        try await send(request(path: "tasks/\(taskId)/cancel", method: "POST"), as: TaskView.self)
    }

    // MARK: - 내부

    private func request(
        path: String, method: String = "GET", query: [URLQueryItem] = []
    ) -> URLRequest {
        let url = serverRootURL.appendingPathComponent("\(Self.prefix)/\(path)")
        var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        if !query.isEmpty { components?.queryItems = query }

        var req = URLRequest(url: components?.url ?? url)
        req.httpMethod = method
        return req
    }

    private func sendJSON<T: Decodable>(
        path: String, body: [String: Any], as type: T.Type
    ) async throws -> T {
        var req = request(path: path, method: "POST")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        return try await send(req, as: type)
    }

    private func send<T: Decodable>(_ request: URLRequest, as type: T.Type) async throws -> T {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw BridgeError.network(error)
        }

        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            throw BridgeError(message: Self.message(for: status, body: data), statusCode: status)
        }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .custom { decoder in
                let container = try decoder.singleValueContainer()
                let value = try container.decode(String.self)
                let fractional = ISO8601DateFormatter()
                fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                if let date = fractional.date(from: value) { return date }
                let standard = ISO8601DateFormatter()
                standard.formatOptions = [.withInternetDateTime]
                if let date = standard.date(from: value) { return date }
                throw DecodingError.dataCorruptedError(
                    in: container,
                    debugDescription: "ISO 8601 날짜를 해석할 수 없습니다: \(value)"
                )
            }
            return try decoder.decode(T.self, from: data)
        } catch {
            throw BridgeError(message: "서버 응답을 해석할 수 없습니다.", statusCode: status)
        }
    }

    private static func message(for status: Int, body: Data) -> String {
        if let detail = try? JSONDecoder().decode(ErrorDetail.self, from: body).detail,
           !detail.isEmpty {
            return detail
        }
        switch status {
        case 401: return "Tailscale 연결과 로그인 계정을 확인해 주세요."
        case 404: return "요청한 항목을 iMac에서 찾을 수 없습니다."
        case 409: return "지금은 처리할 수 없는 상태입니다."
        case 413: return "보낸 이미지가 너무 큽니다."
        case 415: return "지원하지 않는 이미지 형식입니다."
        case 503: return "iMac에서 아직 준비되지 않은 기능입니다."
        default: return "요청이 실패했습니다(\(status))."
        }
    }

    // MARK: multipart 조립

    private static func multipartBody(
        fields: [String: String],
        files: [(name: String, payload: CanvasComposer.ImagePayload)]
    ) -> (Data, String) {
        let boundary = "Boundary-\(UUID().uuidString)"
        var body = Data()

        for (key, value) in fields {
            body.append("--\(boundary)\r\n")
            body.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n")
            body.append("\(value)\r\n")
        }

        for file in files {
            body.append("--\(boundary)\r\n")
            body.append(
                "Content-Disposition: form-data; name=\"\(file.name)\";"
                + " filename=\"\(file.payload.filename)\"\r\n"
            )
            body.append("Content-Type: \(file.payload.mimeType)\r\n\r\n")
            body.append(file.payload.data)
            body.append("\r\n")
        }

        body.append("--\(boundary)--\r\n")
        return (body, "multipart/form-data; boundary=\(boundary)")
    }
}

private extension Data {
    mutating func append(_ string: String) {
        if let data = string.data(using: .utf8) { append(data) }
    }
}
