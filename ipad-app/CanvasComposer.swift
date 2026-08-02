import PencilKit
import UIKit

/// 캔버스 이미지 내보내기.
enum CanvasComposer {

    /// 획만 담은 투명 PNG. 전송(canvasImage)에 쓴다. 배경과 합치지 않는다.
    static func strokesPNG(drawing: PKDrawing, bounds: CGRect, scale: CGFloat = 0) -> Data? {
        drawing.image(from: bounds, scale: resolvedScale(scale)).pngData()
    }

    /// 배경 + 획을 겹친 한 장. 미리보기용(전송에는 안 씀).
    static func previewComposite(
        background: UIImage,
        drawing: PKDrawing,
        canvasBounds: CGRect,
        scale: CGFloat = 0
    ) -> UIImage {
        let resolved = resolvedScale(scale)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = resolved
        format.opaque = true

        let renderer = UIGraphicsImageRenderer(size: canvasBounds.size, format: format)
        return renderer.image { _ in
            drawAspectFill(background, in: CGRect(origin: .zero, size: canvasBounds.size))
            let strokes = drawing.image(from: canvasBounds, scale: resolved)
            strokes.draw(in: CGRect(origin: .zero, size: canvasBounds.size))
        }
    }

    // MARK: - 내부

    // 0이면 화면 배율. 되도록 호출부가 뷰 displayScale을 넘긴다(분할 화면).
    private static func resolvedScale(_ scale: CGFloat) -> CGFloat {
        scale > 0 ? scale : UIScreen.main.scale
    }

    // 비율 유지하며 rect를 꽉 채운다.
    private static func drawAspectFill(_ image: UIImage, in rect: CGRect) {
        let imgSize = image.size
        guard imgSize.width > 0, imgSize.height > 0 else {
            image.draw(in: rect)
            return
        }
        let scale = max(rect.width / imgSize.width, rect.height / imgSize.height)
        let drawn = CGSize(width: imgSize.width * scale, height: imgSize.height * scale)
        let origin = CGPoint(
            x: rect.midX - drawn.width / 2,
            y: rect.midY - drawn.height / 2
        )
        image.draw(in: CGRect(origin: origin, size: drawn))
    }
}
