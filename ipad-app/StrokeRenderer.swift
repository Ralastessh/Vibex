import UIKit

// 획 그리기 공용 로직. 화면 렌더와 전송용 PNG가 같이 쓴다.
enum StrokeRenderer {

    // 업로드 한 장의 최대 변(픽셀). 더 키워도 정확도는 안 오르고 업로드만 느려진다.
    static let maxPixelDimension: CGFloat = 2048

    static func draw(_ strokes: [Stroke], in context: CGContext) {
        for stroke in strokes {
            draw(
                kind: stroke.kind,
                color: stroke.color,
                width: stroke.width,
                points: stroke.points,
                in: context
            )
        }
    }

    static func draw(
        kind: PenKind,
        color: UIColor,
        width: CGFloat,
        points: [StrokePoint],
        in context: CGContext
    ) {
        guard points.count >= 2 else { return }
        context.setLineCap(.round)
        context.setLineJoin(.round)

        if kind == .marker {
            // 형광펜: 굵고 반투명, 균일 굵기.
            context.setStrokeColor(color.withAlphaComponent(0.35).cgColor)
            context.setLineWidth(max(width * 3, 16))
            context.beginPath()
            context.move(to: points[0].location)
            for p in points.dropFirst() { context.addLine(to: p.location) }
            context.strokePath()
            return
        }

        // 펜: 필압으로 구간별 굵기를 바꾼 짧은 선분들.
        context.setStrokeColor(color.cgColor)
        for i in 1..<points.count {
            let a = points[i - 1], b = points[i]
            let pressure = (a.pressure + b.pressure) / 2
            context.setLineWidth(width * (0.5 + 0.9 * pressure))
            context.beginPath()
            context.move(to: a.location)
            context.addLine(to: b.location)
            context.strokePath()
        }
    }

    // 획만 있는 투명 배경 PNG. 서버의 canvasImage와 같은 형식.
    static func pngData(strokes: [Stroke], size: CGSize, displayScale: CGFloat) -> Data? {
        guard size.width > 0, size.height > 0 else { return nil }
        let format = UIGraphicsImageRendererFormat.preferred()
        format.scale = outputScale(for: size, displayScale: displayScale)
        format.opaque = false
        return UIGraphicsImageRenderer(size: size, format: format).pngData { context in
            draw(strokes, in: context.cgContext)
        }
    }

    // 획과 배경이 같은 값을 써야 두 장의 픽셀 크기가 안 어긋난다.
    static func outputScale(for size: CGSize, displayScale: CGFloat) -> CGFloat {
        let longest = max(size.width, size.height)
        guard longest > 0 else { return 1 }
        let scale = displayScale > 0 ? displayScale : 2
        return max(1, min(scale, maxPixelDimension / longest))
    }
}
