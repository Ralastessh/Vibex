// iPad 앱의 시작
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
