import Foundation

// Bridge REST 클라이언트. 모든 요청에 Authorization: Bearer <token>.
struct BridgeClient {
    var config: AppConfig
    var session: URLSession = .shared

    enum BridgeError: LocalizedError {
        case notConfigured
        case badURL
        case http(status: Int, detail: String)
        case decoding(String)

        var errorDescription: String? {
            switch self {
            case .notConfigured: return "연결 설정(주소·토큰)이 필요합니다."
            case .badURL: return "서버 주소가 올바르지 않습니다."
            case let .http(status, detail): return "요청 실패 (\(status)): \(detail)"
            case let .decoding(msg): return "응답 해석 실패: \(msg)"
            }
        }
    }

    // MARK: - 공개 API

    func listProjects() async throws -> [Project] {
        try await get("/projects", as: ProjectListResponse.self).projects
    }

    /// 스크린샷 위 주석을 제출한다. 획(canvasImage)과 원본(baseImage)을 분리해 보낸다.
    func submitDrawing(
        projectId: String,
        canvasImage: Data,
        baseImage: Data,
        clientTaskId: String? = nil
    ) async throws -> TaskCreated {
        var fields: [String: String] = ["projectId": projectId, "mode": "sketch"]
        if let clientTaskId { fields["clientTaskId"] = clientTaskId }
        let files = [
            MultipartFile(field: "canvasImage", filename: "canvas.png", mime: "image/png", data: canvasImage),
            MultipartFile(field: "baseImage", filename: "base.png", mime: "image/png", data: baseImage),
        ]
        return try await upload("/tasks", fields: fields, files: files, as: TaskCreated.self)
    }

    func getTask(_ taskId: String) async throws -> AgentTask {
        try await get("/tasks/\(taskId)", as: AgentTask.self)
    }

    func listTasks(projectId: String, limit: Int = 30) async throws -> [Task] {
        try await get("/tasks?projectId=\(projectId)&limit=\(limit)", as: TaskListResponse.self).tasks
    }

    func confirm(taskId: String, approved: Bool) async throws -> TaskCreated {
        try await postJSON("/tasks/\(taskId)/confirm", body: ["approved": approved], as: TaskCreated.self)
    }

    func answer(
        taskId: String, questionId: String, selectedOptionId: String, freeText: String? = nil
    ) async throws -> TaskCreated {
        var body: [String: Any] = ["questionId": questionId, "selectedOptionId": selectedOptionId]
        if let freeText { body["freeText"] = freeText }
        return try await postJSON("/tasks/\(taskId)/answer", body: body, as: TaskCreated.self)
    }

    func cancel(taskId: String) async throws -> AgentTask {
        try await postJSON("/tasks/\(taskId)/cancel", body: [:], as: AgentTask.self)
    }

    // MARK: - 내부

    private func url(_ path: String) throws -> URL {
        guard config.isComplete else { throw BridgeError.notConfigured }
        guard let root = config.apiRoot, let u = URL(string: root.absoluteString + path) else {
            throw BridgeError.badURL
        }
        return u
    }

    private func authorized(_ url: URL, method: String) -> URLRequest {
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("Bearer \(config.deviceToken)", forHTTPHeaderField: "Authorization")
        return req
    }

    private func get<T: Decodable>(_ path: String, as: T.Type) async throws -> T {
        try await send(authorized(try url(path), method: "GET"))
    }

    private func postJSON<T: Decodable>(_ path: String, body: [String: Any], as: T.Type) async throws -> T {
        var req = authorized(try url(path), method: "POST")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        return try await send(req)
    }

    private func upload<T: Decodable>(
        _ path: String, fields: [String: String], files: [MultipartFile], as: T.Type
    ) async throws -> T {
        let boundary = "Boundary-\(UUID().uuidString)"
        var req = authorized(try url(path), method: "POST")
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        req.httpBody = multipartBody(boundary: boundary, fields: fields, files: files)
        return try await send(req)
    }

    private func send<T: Decodable>(_ req: URLRequest) async throws -> T {
        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw BridgeError.http(status: -1, detail: "응답 없음")
        }
        guard (200..<300).contains(http.statusCode) else {
            throw BridgeError.http(status: http.statusCode, detail: Self.detail(from: data))
        }
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw BridgeError.decoding(String(describing: error))
        }
    }

    /// 백엔드 에러 응답 `{ "detail": "..." }`에서 메시지를 뽑는다.
    private static func detail(from data: Data) -> String {
        if let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let detail = obj["detail"] as? String {
            return detail
        }
        return String(data: data, encoding: .utf8) ?? "알 수 없는 오류"
    }
}

private struct MultipartFile {
    let field: String
    let filename: String
    let mime: String
    let data: Data
}

private func multipartBody(boundary: String, fields: [String: String], files: [MultipartFile]) -> Data {
    var body = Data()
    let crlf = "\r\n"
    func append(_ s: String) { body.append(s.data(using: .utf8)!) }

    for (name, value) in fields {
        append("--\(boundary)\(crlf)")
        append("Content-Disposition: form-data; name=\"\(name)\"\(crlf)\(crlf)")
        append("\(value)\(crlf)")
    }
    for file in files {
        append("--\(boundary)\(crlf)")
        append("Content-Disposition: form-data; name=\"\(file.field)\"; filename=\"\(file.filename)\"\(crlf)")
        append("Content-Type: \(file.mime)\(crlf)\(crlf)")
        body.append(file.data)
        append(crlf)
    }
    append("--\(boundary)--\(crlf)")
    return body
}
