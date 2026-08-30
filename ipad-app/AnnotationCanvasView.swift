// 스크린샷 위에 PencilKit 주석을 그리고 백엔드 작업으로 보내는 화면입니다.
// 화면에서 본 위치와 서버로 보내는 이미지의 위치가 어긋나지 않도록 배경과 캔버스는
// 항상 같은 크기로 맞춰야 합니다.

import PencilKit
import SwiftUI

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

    @State private var canvasView = PKCanvasView()

    /// 재전송해도 작업이 중복 생성되지 않게 하는 값. 전송이 성공할 때까지 유지한다.
    @State private var clientTaskId = UUID().uuidString
    @State private var isSending = false
    @State private var errorMessage: String?

    @Environment(\.displayScale) private var displayScale

    var body: some View {
        // 배경과 캔버스 **모두** 이 크기에 못박는다. PKCanvasView는 UIScrollView라
        // 스스로 보고하는 크기가 화면보다 클 수 있는데, 그러면 ZStack이 부풀어
        // 상단 툴바와 하단 버튼이 화면 밖으로 밀려난다.
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
                PencilCanvas(
                    canvasView: canvasView,
                    allowFingerDrawing: allowFingerDrawing
                )
                .frame(width: geo.size.width, height: geo.size.height)

                // 떠 있는 액션바
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

    // MARK: - 툴바

    private var toolbar: some View {
        HStack(spacing: 8) {
            // 되돌리기/다시하기는 스택이 비면 아무 일도 하지 않는다.
            toolButton(system: "arrow.uturn.backward", label: "되돌리기") {
                canvasView.undoManager?.undo()
            }
            toolButton(system: "arrow.uturn.forward", label: "다시하기") {
                canvasView.undoManager?.redo()
            }
            toolButton(system: "trash", label: "지우기") {
                // 직접 대입하면 되돌릴 수 없다. 전체 삭제야말로 되돌리기가 필요하다.
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

    // MARK: - 전송

    private func send() {
        guard !isSending else { return }

        guard !canvasView.drawing.strokes.isEmpty else {
            errorMessage = "먼저 수정할 부분을 표시해 주세요."
            return
        }

        // 레이아웃에서 역산하지 않고 캔버스에 직접 묻는다.
        // 안전영역까지 확장된 만큼을 놓치면 하단에 그린 획이 잘려 나간다.
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
