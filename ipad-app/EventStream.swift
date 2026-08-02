import Foundation

// WebSocket 진행 이벤트 수신(보조 채널, 주 경로는 폴링).
// TODO: 이벤트 페이로드 형태는 김준수와 확인. 지금은 원시 딕셔너리로 넘김.
final class EventStream {
    private let config: AppConfig
    private var task: URLSessionWebSocketTask?
    private var isRunning = false

    /// 수신 이벤트(딕셔너리) 콜백. ping은 걸러서 전달하지 않는다.
    var onEvent: (([String: Any]) -> Void)?

    init(config: AppConfig) {
        self.config = config
    }

    func start() {
        guard config.isComplete, let url = config.eventsURL else { return }
        isRunning = true
        var req = URLRequest(url: url)
        req.setValue("Bearer \(config.deviceToken)", forHTTPHeaderField: "Authorization")
        let ws = URLSession.shared.webSocketTask(with: req)
        task = ws
        ws.resume()
        receive()
    }

    func stop() {
        isRunning = false
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
    }

    private func receive() {
        task?.receive { [weak self] result in
            guard let self, self.isRunning else { return }
            switch result {
            case let .success(message):
                self.handle(message)
                self.receive() // 다음 메시지 대기
            case .failure:
                // 연결 끊김 → 잠깐 뒤 재연결(폴링이 공백을 메운다).
                self.task = nil
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in
                    if self?.isRunning == true { self?.start() }
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
