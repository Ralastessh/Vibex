// iPad 앱의 시작점입니다.
// 예전 버전이 저장한 서버 포트가 남아 있으면 현재 포트로 바꾼 다음 RootView를 엽니다.

import SwiftUI

@main
struct VibexApp: App {
    init() {
        migrateLegacyBridgePort()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }

    /// 기존 설치가 저장해 둔 8788 주소도 새 빌드에서 즉시 8787로 전환한다.
    private func migrateLegacyBridgePort() {
        let defaults = UserDefaults.standard

        if let value = defaults.string(forKey: "bridgeBaseURL"),
           let migrated = replacingLegacyPort(in: value) {
            defaults.set(migrated, forKey: "bridgeBaseURL")
        }

        if let json = defaults.string(forKey: "bridgeKnownURLs"),
           let data = json.data(using: .utf8),
           let values = try? JSONDecoder().decode([String].self, from: data) {
            let migrated = values.map { replacingLegacyPort(in: $0) ?? $0 }
            if let data = try? JSONEncoder().encode(Array(Set(migrated))),
               let json = String(data: data, encoding: .utf8) {
                defaults.set(json, forKey: "bridgeKnownURLs")
            }
        }
    }

    private func replacingLegacyPort(in value: String) -> String? {
        guard var components = URLComponents(string: value), components.port == 8788 else {
            return nil
        }
        components.port = 8787
        return components.url?.absoluteString
    }
}
