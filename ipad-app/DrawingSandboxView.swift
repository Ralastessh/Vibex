import SwiftUI

/// 서버 없이 캔버스만 여는 연습장. flutter-app의 `DrawingScreen`과 같은 화면이다.
/// PC 브리지를 켜지 않고 필기 도구만 시험할 때 쓴다.
struct DrawingSandboxView: View {
    @AppStorage("allowFingerDrawing") private var allowFingerDrawing = false

    @Environment(\.dismiss) private var dismiss
    @StateObject private var canvas = DrawingController()
    @State private var zoom = PinchZoom()

    var body: some View {
        // 흰 배경만 화면 끝까지. 툴바는 안전영역 안에 둔다.
        ZStack {
            Color.white.ignoresSafeArea()

            GeometryReader { geo in
                ZStack {
                    // 두 손가락 핀치로 줌. 한 손가락(펜)은 캔버스가 가져간다.
                    DrawingCanvas(
                        controller: canvas,
                        allowFingerDrawing: allowFingerDrawing,
                        onPinch: { phase, scale, focus in
                            zoom.apply(phase, scale, focus: focus, in: geo.size)
                        }
                    )
                    .frame(width: geo.size.width, height: geo.size.height)
                    .scaleEffect(zoom.scale, anchor: zoom.anchor)
                    .clipped()

                    VStack(spacing: 8) {
                        topBar
                        DrawingToolbar(controller: canvas)
                    }
                    .frame(maxHeight: .infinity, alignment: .top)
                    .padding(.top, 12)
                }
                .frame(width: geo.size.width, height: geo.size.height)
            }
        }
    }

    private var topBar: some View {
        HStack(spacing: 8) {
            Button { dismiss() } label: { Image(systemName: "xmark") }
            Divider().frame(height: 26)
            Button { canvas.undo() } label: { Image(systemName: "arrow.uturn.backward") }
                .disabled(!canvas.canUndo)
            Button { canvas.redo() } label: { Image(systemName: "arrow.uturn.forward") }
                .disabled(!canvas.canRedo)
            Button(role: .destructive) { canvas.clear() } label: { Image(systemName: "trash") }
                .disabled(canvas.strokes.isEmpty)
        }
        .padding(8)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 14))
    }
}
