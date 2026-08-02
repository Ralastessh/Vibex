import Foundation

// WebSocket 진행 이벤트 수신(보조 채널; 주 경로는 폴링).
// 아직 RootView엔 연결하지 않았다 — 상태는 폴링으로 갱신한다.
// TODO: 이벤트 페이로드 형태는 백엔드와 확인. 지금은 원시 딕셔너리로 넘김.
final class EventStream {
    private let url: URL?
    private let token: String
    private var task: URLSessionWebSocketTask?
    private var running = false

    // ping은 걸러서 전달하지 않는다.
    var onEvent: (([String: Any]) -> Void)?

    init(baseURL: URL, deviceToken: String) {
        token = deviceToken
        var comps = URLComponents(
            url: baseURL.appendingPathComponent("api/v1/events"),
            resolvingAgainstBaseURL: false
        )
        comps?.scheme = baseURL.scheme == "https" ? "wss" : "ws"
        url = comps?.url
    }

    func start() {
        guard let url, !token.isEmpty else { return }
        running = true
        var req = URLRequest(url: url)
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let ws = URLSession.shared.webSocketTask(with: req)
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
                // 끊김 → 잠깐 뒤 재연결(폴링이 공백을 메운다).
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
