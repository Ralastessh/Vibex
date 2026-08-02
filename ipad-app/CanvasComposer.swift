import PencilKit
import UIKit

/// 스크린샷 배경과 손그림 주석을 이미지로 내보낸다.
///
/// 서버는 배경(`baseImage`)과 획(`canvasImage`)을 **따로** 받아서, 획이 배경 위에
/// 겹쳐 그려진 것으로 보고 해석한다. 그래서 두 장은 반드시 같은 좌표계·같은
/// 픽셀 크기여야 한다 — 한 장으로 합쳐 보내면 그 전제가 깨진다.
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
        let base: ImagePayload?         // 배경 스크린샷. 화면에 보이는 그대로 크롭.
        let pixelSize: CGSize
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

    // MARK: - 미리보기·저장용

    /// 배경과 획을 한 장으로 합친다. 화면 미리보기나 로컬 저장에 쓴다.
    /// 서버 전송에는 쓰지 말 것 — `snapshot(...)`을 쓴다.
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
