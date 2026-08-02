import PencilKit
import SwiftUI

/// Vibex 주석 캔버스 화면.
struct AnnotationCanvasView: View {

    /// 주석 대상 스크린샷.
    let screenshot: UIImage

    /// 획(canvasImage)과 원본 스크린샷(baseImage)을 따로 넘긴다.
    /// 백엔드가 둘을 분리해 받고 Vision이 겹쳐 해석한다.
    let onSend: (_ canvasImage: Data, _ baseImage: Data) -> Void

    @State private var canvasView = PKCanvasView()
    @State private var shapeSnapEnabled = false

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .top) {
                // 배경: 스크린샷 (비율 유지, 캔버스 꽉 채움)
                Image(uiImage: screenshot)
                    .resizable()
                    .scaledToFill()
                    .frame(width: geo.size.width, height: geo.size.height)
                    .clipped()

                // 주석 레이어 (투명)
                PencilCanvas(canvasView: canvasView, shapeSnapEnabled: $shapeSnapEnabled)

                // 떠 있는 액션바
                toolbar
                    .padding(.top, 12)
            }
            .ignoresSafeArea(.container, edges: .bottom)
        }
    }

    // MARK: - 툴바

    private var toolbar: some View {
        HStack(spacing: 8) {
            toolButton(system: "arrow.uturn.backward", label: "되돌리기") {
                canvasView.undoManager?.undo()
            }
            toolButton(system: "arrow.uturn.forward", label: "다시하기") {
                canvasView.undoManager?.redo()
            }
            toolButton(system: "trash", label: "지우기") {
                canvasView.setDrawingUndoable(PKDrawing()) // undo에 남게
            }
            Toggle(isOn: $shapeSnapEnabled) {
                Label("도형", systemImage: "square.on.circle")
            }
            .toggleStyle(.button)
            .tint(.blue)

            Spacer(minLength: 12)

            Button {
                send()
            } label: {
                Label("보내기", systemImage: "paperplane.fill")
                    .font(.headline)
                    .padding(.horizontal, 6)
            }
            .buttonStyle(.borderedProminent)
        }
        .padding(8)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        .padding(.horizontal, 16)
    }

    private func toolButton(system: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: system)
                .font(.title3)
                .frame(width: 40, height: 40)
        }
        .accessibilityLabel(label)
    }

    // MARK: - 전송

    private func send() {
        // 캔버스 실제 영역을 쓴다(레이아웃 역산은 하단 획이 잘림).
        let bounds = canvasView.bounds
        guard bounds.width > 0, bounds.height > 0 else { return }
        let scale = canvasView.traitCollection.displayScale

        guard
            let canvasImage = CanvasComposer.strokesPNG(
                drawing: canvasView.drawing, bounds: bounds, scale: scale
            ),
            let baseImage = screenshot.pngData()
        else { return }

        onSend(canvasImage, baseImage)
    }
}
