import PencilKit
import UIKit

/// 실제 WKWebView 렌더와 손그림 주석을 이미지로 내보낸다.
///
/// 서버는 렌더(`renderedViewImage`)와 획(`canvasImage`)을 **따로** 저장한 뒤
/// 선택된 PC LLM CLI 세션에 직접 첨부한다. 두 장은 같은 좌표계·픽셀 크기다.
enum CanvasComposer {

    /// 업로드 한 장의 최대 변(픽셀). 서버 상한은 넉넉하지만, 큰 이미지는
    /// 업로드가 느려지고 해석 토큰만 늘 뿐 정확도에 도움이 되지 않는다.
    static let maxPixelDimension: CGFloat = 2048

    struct ImagePayload {
        let data: Data
        let mimeType: String
        let filename: String
    }

    /// 서버로 보낼 두 장. 같은 rect를 같은 배율로 렌더한 결과다.
    struct Snapshot {
        let canvas: ImagePayload        // 획만. 투명 배경 PNG.
        let base: ImagePayload?         // 현재 라이브 렌더. 전송 순간 자동 캡처.
        let pixelSize: CGSize
    }

    /// 새 프로젝트를 시작할 때 사용하는 한 페이지의 드로우코딩 자료.
    struct BlueprintPage {
        let title: String
        let purpose: String
        let note: String
        let template: String
        let drawing: PKDrawing
        let canvasBounds: CGRect
    }

    // MARK: - 전송용

    /// - Parameters:
    ///   - canvasBounds: `PKCanvasView.bounds`. 레이아웃에서 역산하지 말 것 —
    ///     안전영역 확장 때문에 캔버스와 어긋나 하단 획이 잘린다.
    ///   - displayScale: `@Environment(\.displayScale)`. `UIScreen.main`은
    ///     분할 화면·외부 디스플레이에서 틀린 값을 준다.
    static func snapshot(
        background: UIImage?,
        drawing: PKDrawing,
        canvasBounds: CGRect,
        displayScale: CGFloat
    ) -> Snapshot? {
        let size = canvasBounds.size
        guard size.width > 0, size.height > 0 else { return nil }

        let scale = outputScale(for: size, displayScale: displayScale)

        // 획 — 배경 없이. PKDrawing이 칠하지 않은 곳은 투명하게 남는다.
        let strokes = drawing.image(from: canvasBounds, scale: scale)
        guard let canvasData = strokes.pngData() else { return nil }
        let canvas = ImagePayload(
            data: canvasData, mimeType: "image/png", filename: "canvas.png"
        )

        // 배경 — 화면에 보이는 것과 같은 크롭. 사진에 가까우므로 JPEG가 훨씬 작다.
        var base: ImagePayload?
        if let background {
            let image = renderer(size: size, scale: scale, opaque: true).image { _ in
                drawAspectFill(background, in: CGRect(origin: .zero, size: size))
            }
            if let data = image.jpegData(compressionQuality: 0.9) {
                base = ImagePayload(
                    data: data, mimeType: "image/jpeg", filename: "base.jpg"
                )
            }
        }

        return Snapshot(
            canvas: canvas,
            base: base,
            pixelSize: CGSize(width: size.width * scale, height: size.height * scale)
        )
    }

    /// UI 설계·워크플로·특이사항 페이지를 같은 좌표계의 두 이미지로 묶는다.
    /// 배경에는 페이지 제목과 종이 구조, canvas에는 Apple Pencil 획만 들어간다.
    static func blueprintSnapshot(
        pages: [BlueprintPage], displayScale: CGFloat
    ) -> Snapshot? {
        guard !pages.isEmpty else { return nil }

        let pageSize = CGSize(width: 1120, height: 760)
        let gap: CGFloat = 28
        let size = CGSize(
            width: pageSize.width,
            height: pageSize.height * CGFloat(pages.count) + gap * CGFloat(max(0, pages.count - 1))
        )
        let scale = outputScale(for: size, displayScale: displayScale)

        let baseImage = renderer(size: size, scale: scale, opaque: true).image { context in
            UIColor.systemGroupedBackground.setFill()
            context.fill(CGRect(origin: .zero, size: size))

            for (index, page) in pages.enumerated() {
                let y = CGFloat(index) * (pageSize.height + gap)
                let pageRect = CGRect(x: 0, y: y, width: pageSize.width, height: pageSize.height)
                drawBlueprintBackground(page, in: pageRect, context: context.cgContext)
            }
        }

        let drawingImage = renderer(size: size, scale: scale, opaque: false).image { _ in
            for (index, page) in pages.enumerated() {
                let y = CGFloat(index) * (pageSize.height + gap)
                let target = CGRect(x: 34, y: y + 78, width: pageSize.width - 68, height: pageSize.height - 112)
                guard page.canvasBounds.width > 0, page.canvasBounds.height > 0 else { continue }
                page.drawing.image(from: page.canvasBounds, scale: 1)
                    .draw(in: target, blendMode: .normal, alpha: 1)
            }
        }

        guard let canvasData = drawingImage.pngData(),
              let baseData = baseImage.jpegData(compressionQuality: 0.92) else { return nil }
        return Snapshot(
            canvas: ImagePayload(data: canvasData, mimeType: "image/png", filename: "blueprint-drawing.png"),
            base: ImagePayload(data: baseData, mimeType: "image/jpeg", filename: "blueprint-pages.jpg"),
            pixelSize: CGSize(width: size.width * scale, height: size.height * scale)
        )
    }

    // MARK: - 미리보기·저장용

    /// 배경과 획을 한 장으로 합친다. 화면 미리보기나 로컬 저장에 쓴다.
    /// 서버 전송에는 쓰지 말 것 — 렌더와 획을 분리하는 `snapshot(...)`을 쓴다.
    static func compose(
        background: UIImage,
        drawing: PKDrawing,
        canvasBounds: CGRect,
        displayScale: CGFloat
    ) -> UIImage {
        let size = canvasBounds.size
        let scale = outputScale(for: size, displayScale: displayScale)
        return renderer(size: size, scale: scale, opaque: true).image { _ in
            drawAspectFill(background, in: CGRect(origin: .zero, size: size))
            drawing.image(from: canvasBounds, scale: scale)
                .draw(in: CGRect(origin: .zero, size: size))
        }
    }

    static func pngData(
        background: UIImage,
        drawing: PKDrawing,
        canvasBounds: CGRect,
        displayScale: CGFloat
    ) -> Data? {
        compose(
            background: background,
            drawing: drawing,
            canvasBounds: canvasBounds,
            displayScale: displayScale
        ).pngData()
    }

    // MARK: - 내부

    private static func outputScale(for size: CGSize, displayScale: CGFloat) -> CGFloat {
        let longest = max(size.width, size.height)
        guard longest > 0 else { return 1 }
        let scale = displayScale > 0 ? displayScale : 2
        return max(1, min(scale, maxPixelDimension / longest))
    }

    private static func renderer(
        size: CGSize, scale: CGFloat, opaque: Bool
    ) -> UIGraphicsImageRenderer {
        let format = UIGraphicsImageRendererFormat.preferred()
        format.scale = scale
        format.opaque = opaque
        return UIGraphicsImageRenderer(size: size, format: format)
    }

    private static func drawBlueprintBackground(
        _ page: BlueprintPage,
        in rect: CGRect,
        context: CGContext
    ) {
        UIColor.systemBackground.setFill()
        UIBezierPath(roundedRect: rect.insetBy(dx: 1, dy: 1), cornerRadius: 22).fill()
        UIColor.separator.withAlphaComponent(0.35).setStroke()
        let border = UIBezierPath(roundedRect: rect.insetBy(dx: 1, dy: 1), cornerRadius: 22)
        border.lineWidth = 2
        border.stroke()

        let title = page.title as NSString
        title.draw(
            in: CGRect(x: rect.minX + 34, y: rect.minY + 24, width: rect.width - 68, height: 40),
            withAttributes: [
                .font: UIFont.systemFont(ofSize: 28, weight: .bold),
                .foregroundColor: UIColor.label,
            ]
        )
        let canvas = CGRect(x: rect.minX + 34, y: rect.minY + 78, width: rect.width - 68, height: rect.height - 112)
        UIColor.secondarySystemBackground.setFill()
        UIBezierPath(roundedRect: canvas, cornerRadius: 12).fill()

        context.saveGState()
        context.setStrokeColor(UIColor.separator.withAlphaComponent(0.22).cgColor)
        context.setLineWidth(1)
        if page.template == "grid" {
            stride(from: canvas.minX, through: canvas.maxX, by: 32).forEach {
                context.move(to: CGPoint(x: $0, y: canvas.minY)); context.addLine(to: CGPoint(x: $0, y: canvas.maxY))
            }
            stride(from: canvas.minY, through: canvas.maxY, by: 32).forEach {
                context.move(to: CGPoint(x: canvas.minX, y: $0)); context.addLine(to: CGPoint(x: canvas.maxX, y: $0))
            }
            context.strokePath()
        } else if page.template == "dots" {
            context.setFillColor(UIColor.tertiaryLabel.withAlphaComponent(0.35).cgColor)
            for x in stride(from: canvas.minX + 16, to: canvas.maxX, by: 28) {
                for y in stride(from: canvas.minY + 16, to: canvas.maxY, by: 28) {
                    context.fillEllipse(in: CGRect(x: x - 1.2, y: y - 1.2, width: 2.4, height: 2.4))
                }
            }
        }
        context.restoreGState()
    }

    /// 비율을 유지하며 rect를 꽉 채우도록 그린다.
    /// SwiftUI 쪽 `.aspectRatio(contentMode: .fill)` + `.clipped()`와 같은 결과여야
    /// 화면에서 본 것과 서버로 간 것이 일치한다.
    private static func drawAspectFill(_ image: UIImage, in rect: CGRect) {
        let imageSize = image.size
        guard imageSize.width > 0, imageSize.height > 0 else {
            image.draw(in: rect)
            return
        }
        let scale = max(rect.width / imageSize.width, rect.height / imageSize.height)
        let drawn = CGSize(width: imageSize.width * scale, height: imageSize.height * scale)
        let origin = CGPoint(x: rect.midX - drawn.width / 2, y: rect.midY - drawn.height / 2)
        image.draw(in: CGRect(origin: origin, size: drawn))
    }
}
