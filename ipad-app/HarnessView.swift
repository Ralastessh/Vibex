// 전체 앱 흐름을 거치지 않고 캔버스와 전송 기능만 빠르게 확인하는 개발용 화면입니다.
// 실제 사용자가 들어오는 화면은 RootView이므로 앱 기능을 추가할 때 둘을 혼동하면 안 됩니다.

import PencilKit
import SwiftUI
import UIKit

struct HarnessView: View {
    @AppStorage("bridgeBaseURL") private var baseURLText = "http://127.0.0.1:8787"
    @AppStorage("bridgeProjectId") private var projectId = "demo"
    /// 시뮬레이터에는 펜슬이 없어 기본값(펜만 허용)으로는 그릴 수 없다.
    @AppStorage("allowFingerDrawing") private var allowFingerDrawing = false

    @State private var projects: [ProjectView] = []
    @State private var message = ""
    @State private var isLoading = false
    @State private var showCanvas = false

    private var client: BridgeClient {
        let url = URL(string: baseURLText.trimmingCharacters(in: .whitespaces))
            ?? URL(string: "http://127.0.0.1:8000")!
        return BridgeClient(baseURL: url)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("iMac 연결") {
                    TextField("주소", text: $baseURLText)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                    Button("프로젝트 불러오기") { loadProjects() }
                        .disabled(isLoading)
                }

                Section("프로젝트") {
                    if projects.isEmpty {
                        TextField("projectId 직접 입력", text: $projectId)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                    } else {
                        Picker("대상", selection: $projectId) {
                            ForEach(projects) { project in
                                Text("\(project.displayName) · \(project.status.rawValue)")
                                    .tag(project.projectId)
                            }
                        }
                    }
                }

                Section("캔버스") {
                    Toggle("손가락으로 그리기(시뮬레이터용)", isOn: $allowFingerDrawing)
                    Button("캔버스 열기") { showCanvas = true }
                }

                if !message.isEmpty {
                    Section("상태") {
                        Text(message).font(.callout)
                    }
                }
            }
            .navigationTitle("Vibex 시험용")
        }
        .fullScreenCover(isPresented: $showCanvas) {
            AnnotationCanvasView(
                projectId: projectId,
                screenshot: SampleScreenshot.loginScreen(),
                client: client,
                allowFingerDrawing: allowFingerDrawing
            ) { created in
                message = "작업 생성됨 — \(created.taskId) [\(created.status.rawValue)]"
                showCanvas = false
            }
            .overlay(alignment: .bottomLeading) {
                Button("닫기") { showCanvas = false }
                    .buttonStyle(.bordered)
                    .padding(24)
            }
        }
    }

    private func loadProjects() {
        isLoading = true
        message = "불러오는 중…"
        Task {
            do {
                projects = try await client.listProjects()
                if let first = projects.first, !projects.contains(where: { $0.projectId == projectId }) {
                    projectId = first.projectId
                }
                message = "프로젝트 \(projects.count)개"
            } catch {
                projects = []
                message = error.localizedDescription
            }
            isLoading = false
        }
    }
}

/// 주석 대상으로 쓸 가짜 로그인 화면. 실제 스크린샷이 없을 때 대역으로 쓴다.
enum SampleScreenshot {
    static func loginScreen(size: CGSize = CGSize(width: 1024, height: 1366)) -> UIImage {
        UIGraphicsImageRenderer(size: size).image { context in
            let cgContext = context.cgContext

            UIColor.systemGray6.setFill()
            cgContext.fill(CGRect(origin: .zero, size: size))

            let card = CGRect(
                x: size.width * 0.14, y: size.height * 0.24,
                width: size.width * 0.72, height: size.height * 0.44
            )
            UIColor.white.setFill()
            UIBezierPath(roundedRect: card, cornerRadius: 28).fill()

            draw("로그인", in: CGRect(x: card.minX + 40, y: card.minY + 44,
                                    width: card.width - 80, height: 52),
                 size: 40, weight: .bold, color: .label)

            var y = card.minY + 130
            for placeholder in ["이메일", "비밀번호"] {
                let field = CGRect(x: card.minX + 40, y: y, width: card.width - 80, height: 64)
                UIColor.systemGray5.setFill()
                UIBezierPath(roundedRect: field, cornerRadius: 12).fill()
                draw(placeholder, in: field.insetBy(dx: 18, dy: 18),
                     size: 22, weight: .regular, color: .secondaryLabel)
                y += 88
            }

            let button = CGRect(x: card.minX + 40, y: y + 16, width: card.width - 80, height: 68)
            UIColor.systemBlue.setFill()
            UIBezierPath(roundedRect: button, cornerRadius: 14).fill()
            draw("로그인", in: button.insetBy(dx: 0, dy: 20),
                 size: 24, weight: .semibold, color: .white, alignment: .center)
        }
    }

    private static func draw(
        _ text: String, in rect: CGRect, size: CGFloat,
        weight: UIFont.Weight, color: UIColor, alignment: NSTextAlignment = .left
    ) {
        let paragraph = NSMutableParagraphStyle()
        paragraph.alignment = alignment
        NSAttributedString(string: text, attributes: [
            .font: UIFont.systemFont(ofSize: size, weight: weight),
            .foregroundColor: color,
            .paragraphStyle: paragraph,
        ]).draw(in: rect)
    }
}
