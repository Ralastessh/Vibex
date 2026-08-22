import UIKit

/// 실제 WKWebView 렌더와 손그림 주석을 이미지로 내보낸다.
///
/// 서버는 렌더(`renderedViewImage`)와 획(`canvasImage`)을 **따로** 저장한 뒤
/// 선택된 PC LLM CLI 세션에 직접 첨부한다. 두 장은 같은 좌표계·픽셀 크기다.
enum CanvasComposer {

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

    // MARK: - 전송용

    /// - Parameters:
    ///   - canvasSize: 캔버스 뷰의 크기. 획 좌표가 이 좌표계에 있어야 한다.
    ///   - displayScale: `@Environment(\.displayScale)`. `UIScreen.main`은
    ///     분할 화면·외부 디스플레이에서 틀린 값을 준다.
    static func snapshot(
        background: UIImage?,
        strokes: [Stroke],
        canvasSize: CGSize,
        displayScale: CGFloat
    ) -> Snapshot? {
        guard canvasSize.width > 0, canvasSize.height > 0 else { return nil }

        let scale = StrokeRenderer.outputScale(for: canvasSize, displayScale: displayScale)

        // 획 — 배경 없이. 칠하지 않은 곳은 투명하게 남는다.
        guard let canvasData = StrokeRenderer.pngData(
            strokes: strokes, size: canvasSize, displayScale: displayScale
        ) else { return nil }
        let canvas = ImagePayload(
            data: canvasData, mimeType: "image/png", filename: "canvas.png"
        )

        // 배경 — 화면에 보이는 것과 같은 크롭. 사진에 가까우므로 JPEG가 훨씬 작다.
        var base: ImagePayload?
        if let background {
            let image = renderer(size: canvasSize, scale: scale, opaque: true).image { _ in
                drawAspectFill(background, in: CGRect(origin: .zero, size: canvasSize))
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
            pixelSize: CGSize(
                width: canvasSize.width * scale, height: canvasSize.height * scale
            )
        )
    }

    // MARK: - 미리보기·저장용

    /// 배경과 획을 한 장으로 합친다. 화면 미리보기나 로컬 저장에 쓴다.
    /// 서버 전송에는 쓰지 말 것 — 렌더와 획을 분리하는 `snapshot(...)`을 쓴다.
    static func compose(
        background: UIImage,
        strokes: [Stroke],
        canvasSize: CGSize,
        displayScale: CGFloat
    ) -> UIImage {
        let scale = StrokeRenderer.outputScale(for: canvasSize, displayScale: displayScale)
        return renderer(size: canvasSize, scale: scale, opaque: true).image { context in
            drawAspectFill(background, in: CGRect(origin: .zero, size: canvasSize))
            StrokeRenderer.draw(strokes, in: context.cgContext)
        }
    }

    static func pngData(
        background: UIImage,
        strokes: [Stroke],
        canvasSize: CGSize,
        displayScale: CGFloat
    ) -> Data? {
        compose(
            background: background,
            strokes: strokes,
            canvasSize: canvasSize,
            displayScale: displayScale
        ).pngData()
    }

    // MARK: - 내부

    private static func renderer(
        size: CGSize, scale: CGFloat, opaque: Bool
    ) -> UIGraphicsImageRenderer {
        let format = UIGraphicsImageRendererFormat.preferred()
        format.scale = scale
        format.opaque = opaque
        return UIGraphicsImageRenderer(size: size, format: format)
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
