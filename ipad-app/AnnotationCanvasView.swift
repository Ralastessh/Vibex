// 프리뷰 위에 PencilKit 주석을 그리고 백엔드 작업으로 보내는 화면
// 화면에서 본 위치와 서버로 보내는 이미지의 위치가 어긋나지 않도록 배경과 캔버스는 항상 같은 크기로 맞춤
import PencilKit
import SwiftUI

struct AnnotationCanvasView: View {

    /// 어느 프로젝트에 보낼 작업인지, 경로는 서버가 정하므로 id만 넘김
    let projectId: String

    /// 주석 대상 스크린샷
    let screenshot: UIImage

    let client: BridgeClient

    var allowFingerDrawing = false

    /// 작업이 만들어지면 상위(확인 화면)로 넘김
    var onCreated: (TaskCreated) -> Void = { _ in }

    @State private var canvasView = PKCanvasView()

    /// 재전송해도 작업이 중복 생성되지 않게 하는 값. 전송이 성공할 때까지 유지
    @State private var clientTaskId = UUID().uuidString
    @State private var isSending = false
    @State private var errorMessage: String?

    @Environment(\.displayScale) private var displayScale

    var body: some View {
        // 배경과 캔버스 크기를 제한 -> PKCanvasView의 크기가 화면보다 클 때 ZStack이 부풀어 상단 툴바와 하단 버튼이 화면 밖으로 밀려나는 문제 발생
        GeometryReader { geo in
            ZStack(alignment: .top) {
                // iPad 앱의 화면과 서버에서 보는 화면이 달라지는 것을 방지
                Image(uiImage: screenshot)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: geo.size.width, height: geo.size.height)
                    .clipped()

                PencilCanvas(
                    canvasView: canvasView,
                    allowFingerDrawing: allowFingerDrawing
                )
                .frame(width: geo.size.width, height: geo.size.height)

                toolbar
                    .padding(.top, 12)
            }
            .frame(width: geo.size.width, height: geo.size.height)
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

    private var toolbar: some View {
        HStack(spacing: 8) {
            toolButton(system: "arrow.uturn.backward", label: "되돌리기") {
                canvasView.undoManager?.undo()
            }
            toolButton(system: "arrow.uturn.forward", label: "다시하기") {
                canvasView.undoManager?.redo()
            }
            toolButton(system: "trash", label: "지우기") {
                canvasView.setDrawingUndoably(PKDrawing(), actionName: "전체 지우기")
            }
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

    private func send() {
        guard !isSending else { return }

        guard !canvasView.drawing.strokes.isEmpty else {
            errorMessage = "먼저 수정할 부분을 표시해 주세요."
            return
        }

        guard let snapshot = CanvasComposer.snapshot(
            background: screenshot,
            drawing: canvasView.drawing,
            canvasBounds: canvasView.bounds,
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
                clientTaskId = UUID().uuidString
                onCreated(created)
            } catch {
                // 실패 시 clientTaskId를 그대로 두기 때문에, 다시 눌러도 중복 작업이 생기지 않게 함
                errorMessage = error.localizedDescription
            }
            isSending = false
        }
    }
}
