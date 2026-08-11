import Foundation

// WebSocket 진행 이벤트(보조 — 지금은 폴링을 씀).
// TODO: 이벤트 페이로드 형태 백엔드와 확인.
final class EventStream {
    private let url: URL?
    private var task: URLSessionWebSocketTask?
    private var running = false

    // ping은 걸러서 전달하지 않는다.
    var onEvent: (([String: Any]) -> Void)?

    init(baseURL: URL) {
        var comps = URLComponents(
            url: baseURL.appendingPathComponent("api/v1/events"),
            resolvingAgainstBaseURL: false
        )
        comps?.scheme = baseURL.scheme == "https" ? "wss" : "ws"
        url = comps?.url
    }

    func start() {
        guard let url else { return }
        running = true
        let ws = URLSession.shared.webSocketTask(with: url)
        task = ws
        ws.resume()
        receive()
    }

    func stop() {
        running = false
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
    }

    private func receive() {
        task?.receive { [weak self] result in
            guard let self, self.running else { return }
            switch result {
            case let .success(message):
                self.handle(message)
                self.receive()
            case .failure:
                // 끊기면 재연결.
                self.task = nil
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in
                    if self?.running == true { self?.start() }
                }
            }
        }
    }

    private func handle(_ message: URLSessionWebSocketTask.Message) {
        guard case let .string(text) = message,
              let data = text.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return }
        if obj["type"] as? String == "ping" { return }
        DispatchQueue.main.async { [weak self] in self?.onEvent?(obj) }
    }
}
