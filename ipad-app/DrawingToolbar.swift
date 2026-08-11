import SwiftUI

// 항상 보이는 필기 툴바 — 펜/형광펜/지우개/올가미 + 색·두께.
struct DrawingToolbar: View {
    @Binding var tool: DrawTool

    private let palette = ["#111111", "#2f6bff", "#e0564a", "#1f9d55", "#f59e0b", "#8b5cf6"]
    private let widths: [CGFloat] = [2, 5, 9]

    var body: some View {
        HStack(spacing: 10) {
            HStack(spacing: 4) {
                toolButton(.pen, "pencil.tip")
                toolButton(.marker, "highlighter")
                toolButton(.eraser, "eraser")
                toolButton(.lasso, "lasso")
            }

            if tool.kind.usesColor {
                Divider().frame(height: 26)

                HStack(spacing: 6) {
                    ForEach(palette, id: \.self) { hex in
                        Circle()
                            .fill(Color(uiColor: UIColor(hex: hex)))
                            .frame(width: 22, height: 22)
                            .overlay(
                                Circle().stroke(Color.primary, lineWidth: tool.colorHex == hex ? 2 : 0)
                            )
                            .onTapGesture { tool.colorHex = hex }
                    }
                }

                Divider().frame(height: 26)

                HStack(spacing: 8) {
                    ForEach(widths, id: \.self) { w in
                        Circle()
                            .fill(Color.primary)
                            .frame(width: w + 4, height: w + 4)
                            .frame(width: 30, height: 30)
                            .background(
                                tool.width == w ? Color.primary.opacity(0.12) : .clear,
                                in: Circle()
                            )
                            .onTapGesture { tool.width = w }
                    }
                }
            }
        }
        .padding(8)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 14))
        .padding(.horizontal, 16)
    }

    private func toolButton(_ kind: PenKind, _ icon: String) -> some View {
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
    }
}
