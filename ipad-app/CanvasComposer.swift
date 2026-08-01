import PencilKit
import UIKit

/// 스크린샷 배경과 손그림 주석을 하나의 이미지로 합성
enum CanvasComposer {

    /// 배경 이미지와 PencilKit 드로잉을 겹쳐 한 장의 UIImage
    ///
    /// - Parameters:
    ///   - background: 주석 대상 스크린샷.
    ///   - drawing: PKCanvasView.drawing (주석 획).
    ///   - canvasBounds: 캔버스(=배경 표시 영역)의 좌표 공간
    ///   - scale: 출력 배율
    static func compose(
        background: UIImage,
        drawing: PKDrawing,
        canvasBounds: CGRect,
        scale: CGFloat = 0
    ) -> UIImage {
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = scale > 0 ? scale : UIScreen.main.scale
        format.opaque = true

        let renderer = UIGraphicsImageRenderer(size: canvasBounds.size, format: format)
        return renderer.image { _ in
            // 1) 배경 스크린샷을 캔버스에 꽉 맞춰 그림
            drawAspectFill(background, in: CGRect(origin: .zero, size: canvasBounds.size))
            // 2) 그 위에 주석 획을 얹음
            let strokes = drawing.image(from: canvasBounds, scale: format.scale)
            strokes.draw(in: CGRect(origin: .zero, size: canvasBounds.size))
        }
    }

    /// 합성 결과를 PNG 데이터로
    static func pngData(
        background: UIImage,
        drawing: PKDrawing,
        canvasBounds: CGRect,
        scale: CGFloat = 0
    ) -> Data? {
        compose(background: background, drawing: drawing, canvasBounds: canvasBounds, scale: scale)
            .pngData()
    }

    /// 비율을 유지하며 rect를 꽉 채우도록 그림
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
