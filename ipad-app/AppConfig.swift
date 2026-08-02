import Foundation

// 연결 설정 — Bridge 주소와 기기 토큰. 토큰은 코드에 안 넣고 UserDefaults에 저장.
struct AppConfig: Equatable {
    var baseURL: String
    var deviceToken: String

    static let apiPrefix = "/api/v1"

    private enum Keys {
        static let baseURL = "bridge.baseURL"
        static let deviceToken = "bridge.deviceToken"
    }

    static func load(_ defaults: UserDefaults = .standard) -> AppConfig {
        AppConfig(
            baseURL: defaults.string(forKey: Keys.baseURL) ?? "http://127.0.0.1:8000",
            deviceToken: defaults.string(forKey: Keys.deviceToken) ?? ""
        )
    }

    func save(_ defaults: UserDefaults = .standard) {
        defaults.set(baseURL, forKey: Keys.baseURL)
        defaults.set(deviceToken, forKey: Keys.deviceToken)
    }

    var isComplete: Bool {
        !baseURL.trimmingCharacters(in: .whitespaces).isEmpty
            && !deviceToken.trimmingCharacters(in: .whitespaces).isEmpty
    }

    /// REST 기본 URL (…/api/v1).
    var apiRoot: URL? { URL(string: baseURL.trimmingCharacters(in: .whitespaces) + Self.apiPrefix) }

    /// WebSocket 이벤트 URL. http→ws, https→wss로 바꾼다.
    var eventsURL: URL? {
        let trimmed = baseURL.trimmingCharacters(in: .whitespaces)
        let ws = trimmed
            .replacingOccurrences(of: "https://", with: "wss://")
            .replacingOccurrences(of: "http://", with: "ws://")
        return URL(string: ws + Self.apiPrefix + "/events")
    }
}
