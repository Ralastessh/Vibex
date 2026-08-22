import SwiftUI

// 항상 보이는 필기 툴바 — 펜/형광펜/지우개/올가미 + 색·두께.
struct DrawingToolbar: View {
    @ObservedObject var controller: DrawingController

    private let widths: [CGFloat] = [2, 5, 9]
    private let eraserWidths: [CGFloat] = [12, 24, 40]

    private var tool: DrawTool { controller.tool }

    var body: some View {
        HStack(spacing: 10) {
            HStack(spacing: 4) {
                toolButton(.pen, "pencil.tip")
                toolButton(.marker, "highlighter")
                toolButton(.eraser, "eraser")
                toolButton(.lasso, "lasso")
            }

            if tool.usesColor {
                Divider().frame(height: 26)
                palette
                Divider().frame(height: 26)

                HStack(spacing: 8) {
                    ForEach(widths, id: \.self) { w in
                        widthDot(dot: w + 4, selected: tool.width == w) {
                            controller.tool.width = w
                        }
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
                        widthDot(dot: w / 2 + 4, selected: tool.eraserWidth == w) {
                            controller.tool.eraserWidth = w
                        }
                    }
                }
            } else if tool.kind == .lasso, !controller.selection.isEmpty {
                // 선택된 획 색 변경 + 삭제.
                Divider().frame(height: 26)
                palette
                Divider().frame(height: 26)

                Button(role: .destructive) {
                    controller.deleteSelected()
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 17))
                        .frame(width: 40, height: 34)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(8)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 14))
        .padding(.horizontal, 16)
    }

    private var palette: some View {
        HStack(spacing: 6) {
            ForEach(DrawTool.palette, id: \.self) { color in
                Circle()
                    .fill(Color(uiColor: color))
                    .frame(width: 22, height: 22)
                    .overlay(
                        Circle().stroke(
                            Color.primary, lineWidth: tool.color == color ? 2 : 0
                        )
                    )
                    .onTapGesture {
                        // 올가미로 고른 게 있으면 그 획의 색을 바꾼다.
                        if tool.kind == .lasso {
                            controller.recolorSelected(color)
                        } else {
                            controller.tool.color = color
                        }
                    }
            }
        }
    }

    private func eraserModeButton(_ mode: EraserMode, _ label: String) -> some View {
        Button {
            controller.tool.eraserMode = mode
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

    private func toolButton(_ kind: PenKind, _ icon: String) -> some View {
        Button {
            controller.tool.kind = kind
            controller.clearSelection()
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
