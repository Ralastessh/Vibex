import PencilKit
import SwiftUI

/// Vibex 주석 캔버스 화면.
struct AnnotationCanvasView: View {

    /// 주석 대상 스크린샷.
    let screenshot: UIImage
    
    /// 합성된 PNG를 상위(전송 흐름)로 전달.
    let onSend: (Data) -> Void

    @State private var canvasView = PKCanvasView()
    @State private var shapeSnapEnabled = false

    var body: some View {
        GeometryReader { geo in
            let bounds = CGRect(origin: .zero, size: geo.size)

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
                toolbar(bounds: bounds)
                    .padding(.top, 12)
            }
            .ignoresSafeArea(.container, edges: .bottom)
        }
    }

    // MARK: - 툴바

    private func toolbar(bounds: CGRect) -> some View {
        HStack(spacing: 8) {
            toolButton(system: "arrow.uturn.backward", label: "되돌리기") {
                canvasView.undoManager?.undo()
            }
            toolButton(system: "trash", label: "지우기") {
                canvasView.drawing = PKDrawing()
            }
            Toggle(isOn: $shapeSnapEnabled) {
                Label("도형", systemImage: "square.on.circle")
            }
            .toggleStyle(.button)
            .tint(.blue)

            Spacer(minLength: 12)

            Button {
                send(bounds: bounds)
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

    private func send(bounds: CGRect) {
        guard let data = CanvasComposer.pngData(
            background: screenshot,
            drawing: canvasView.drawing,
            canvasBounds: bounds
        ) else { return }
        onSend(data)
    }
}
