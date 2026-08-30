// 펜, 형광펜, 지우개, 올가미와 각 도구의 세부 설정을 보여 주는 툴바입니다.
// 실제 그리기 처리는 PencilCanvas가 맡고 이 화면은 DrawTool 값만 바꿉니다.

import SwiftUI

// 항상 보이는 필기 툴바 — 펜/형광펜/지우개/올가미 + 색·두께.
struct DrawingToolbar: View {
    @Binding var tool: DrawTool

    private let widths: [CGFloat] = [2, 5, 9]
    private let eraserWidths: [CGFloat] = [12, 24, 40]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
        HStack(spacing: 10) {
            HStack(spacing: 4) {
                toolButton(.pen, "pencil.tip", "펜")
                toolButton(.marker, "highlighter", "형광펜")
                toolButton(.eraser, "eraser", "지우개")
                toolButton(.lasso, "lasso", "올가미")
            }

            if tool.kind.usesColor {
                Divider().frame(height: 26)

                HStack(spacing: 6) {
                    ForEach(DrawTool.palette, id: \.self) { hex in
                        Circle()
                            .fill(Color(uiColor: UIColor(hex: hex)))
                            .frame(width: 22, height: 22)
                            .overlay(
                                Circle().stroke(Color.primary, lineWidth: tool.colorHex == hex ? 2 : 0)
                            )
                            .onTapGesture { tool.colorHex = hex }
                    }
                    ColorPicker(
                        "사용자 색상",
                        selection: Binding(
                            get: { Color(uiColor: UIColor(hex: tool.colorHex)) },
                            set: { tool.colorHex = UIColor($0).hexRGB }
                        ),
                        supportsOpacity: false
                    )
                    .labelsHidden()
                    .frame(width: 28)
                }

                Divider().frame(height: 26)

                HStack(spacing: 8) {
                    ForEach(widths, id: \.self) { w in
                        widthDot(dot: w + 4, selected: tool.width == w) { tool.width = w }
                    }
                }
            } else if tool.kind == .eraser {
                Divider().frame(height: 26)

                HStack(spacing: 4) {
                    eraserModeButton(.pixel, "일부")
                    eraserModeButton(.object, "전체")
                }

                Divider().frame(height: 26)

                HStack(spacing: 8) {
                    ForEach(eraserWidths, id: \.self) { w in
                        // 지우개 실제 굵기는 최대 40이라 점 크기는 보기 좋게 눌러 표시.
                        widthDot(dot: w / 2 + 4, selected: tool.eraserWidth == w) { tool.eraserWidth = w }
                    }
                }
            }
        }
        }
        .padding(8)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 14))
        .padding(.horizontal, 16)
    }

    private func eraserModeButton(_ mode: EraserMode, _ label: String) -> some View {
        Button {
            tool.eraserMode = mode
        } label: {
            Text(label)
                .font(.system(size: 13, weight: .medium))
                .frame(width: 40, height: 30)
                .background(
                    tool.eraserMode == mode ? Color.accentColor.opacity(0.2) : .clear,
                    in: RoundedRectangle(cornerRadius: 8)
                )
        }
        .buttonStyle(.plain)
    }

    private func widthDot(dot: CGFloat, selected: Bool, action: @escaping () -> Void) -> some View {
        Circle()
            .fill(Color.primary)
            .frame(width: dot, height: dot)
            .frame(width: 30, height: 30)
            .background(selected ? Color.primary.opacity(0.12) : .clear, in: Circle())
            .onTapGesture(perform: action)
    }

    private func toolButton(_ kind: PenKind, _ icon: String, _ label: String) -> some View {
        Button {
            tool.kind = kind
        } label: {
            Image(systemName: icon)
                .font(.system(size: 17))
                .frame(width: 40, height: 34)
                .background(
                    tool.kind == kind ? Color.accentColor.opacity(0.2) : .clear,
                    in: RoundedRectangle(cornerRadius: 8)
                )
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }
}
