import SwiftUI

/// Vibex 주석 캔버스 화면.
struct AnnotationCanvasView: View {

    /// 어느 프로젝트에 보낼 작업인지. 경로는 서버가 정하므로 id만 넘긴다.
    let projectId: String

    /// 주석 대상 스크린샷.
    let screenshot: UIImage

    let client: BridgeClient

    /// 시뮬레이터에서 손가락으로 시험할 때만 켠다. 실기기에서는 꺼 두어야
    /// 손바닥이 닿을 때 획이 그려지지 않는다.
    var allowFingerDrawing = false

    /// 작업이 만들어지면 상위(확인 화면)로 넘긴다.
    var onCreated: (TaskCreated) -> Void = { _ in }

    @StateObject private var canvas = DrawingController()
    @State private var canvasSize: CGSize = .zero

    /// 재전송해도 작업이 중복 생성되지 않게 하는 값. 전송이 성공할 때까지 유지한다.
    @State private var clientTaskId = UUID().uuidString
    @State private var isSending = false
    @State private var errorMessage: String?

    @Environment(\.displayScale) private var displayScale

    var body: some View {
        // 배경과 캔버스 **모두** 이 크기에 못박는다. 여기가 어긋나면 전송 이미지의
        // 획 좌표가 배경과 맞지 않는다.
        GeometryReader { geo in
            ZStack(alignment: .top) {
                // 배경: 스크린샷. 캔버스와 **같은 영역**을 채워야 한다 —
                // 여기가 어긋나면 화면에서 본 것과 서버로 간 것이 달라진다.
                Image(uiImage: screenshot)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: geo.size.width, height: geo.size.height)
                    .clipped()

                // 주석 레이어 (투명)
                DrawingCanvas(
                    controller: canvas,
                    allowFingerDrawing: allowFingerDrawing
                )
                .frame(width: geo.size.width, height: geo.size.height)

                // 떠 있는 액션바
                VStack(spacing: 8) {
                    toolbar
                    DrawingToolbar(controller: canvas)
                }
                .padding(.top, 12)
            }
            .frame(width: geo.size.width, height: geo.size.height)
            .onAppear { canvasSize = geo.size }
            .onChange(of: geo.size) { canvasSize = $0 }
        }
        .ignoresSafeArea(.container, edges: .bottom)
        .alert(
            "보내지 못했습니다",
            isPresented: Binding(
                get: { errorMessage != nil },
                set: { if !$0 { errorMessage = nil } }
            ),
            actions: { Button("확인", role: .cancel) {} },
            message: { Text(errorMessage ?? "") }
        )
    }

    // MARK: - 툴바

    private var toolbar: some View {
        HStack(spacing: 8) {
            toolButton(system: "arrow.uturn.backward", label: "되돌리기") { canvas.undo() }
                .disabled(!canvas.canUndo)
            toolButton(system: "arrow.uturn.forward", label: "다시하기") { canvas.redo() }
                .disabled(!canvas.canRedo)
            toolButton(system: "trash", label: "지우기") { canvas.clear() }
                .disabled(canvas.strokes.isEmpty)

            Spacer(minLength: 12)

            Button(action: send) {
                if isSending {
                    ProgressView()
                        .frame(width: 40, height: 40)
                } else {
                    Label("보내기", systemImage: "paperplane.fill")
                        .font(.headline)
                        .padding(.horizontal, 6)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(isSending)
        }
        .padding(8)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        .padding(.horizontal, 16)
    }

    private func toolButton(
        system: String, label: String, action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: system)
                .font(.title3)
                .frame(width: 40, height: 40)
        }
        .accessibilityLabel(label)
    }

    // MARK: - 전송

    private func send() {
        guard !isSending else { return }

        guard !canvas.strokes.isEmpty else {
            errorMessage = "먼저 수정할 부분을 표시해 주세요."
            return
        }

        guard let snapshot = CanvasComposer.snapshot(
            background: screenshot,
            strokes: canvas.strokes,
            canvasSize: canvasSize,
            displayScale: displayScale
        ) else {
            errorMessage = "캔버스를 아직 준비하지 못했습니다."
            return
        }

        isSending = true
        Task {
            do {
                let created = try await client.createTask(
                    projectId: projectId,
                    snapshot: snapshot,
                    clientTaskId: clientTaskId
                )
                // 성공했으니 다음 그림은 새 작업이다.
                clientTaskId = UUID().uuidString
                onCreated(created)
            } catch {
                // 실패 시 clientTaskId를 그대로 두어, 다시 눌러도 중복 작업이 생기지 않게 한다.
                errorMessage = error.localizedDescription
            }
            isSending = false
        }
    }
}
