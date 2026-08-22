import CoreGraphics
import Foundation

/// 지우개 한 점 적용. 판정은 점이 아니라 **선분** 기준이라
/// 점이 성긴 획(스냅된 직선 등)도 중간 아무 데나 닿으면 지워진다.
enum Eraser {

    struct Result {
        let changed: Bool
        let strokes: [Stroke]
    }

    static func erase(
        _ strokes: [Stroke], at point: CGPoint, radius: CGFloat, mode: EraserMode
    ) -> Result {
        var next: [Stroke] = []
        var changed = false

        for stroke in strokes {
            guard hits(stroke, point, radius) else {
                next.append(stroke)
                continue
            }
            changed = true
            if mode == .object { continue } // 통째로 삭제

            // 일부 지우기: 반경보다 촘촘히 리샘플한 뒤,
            // 반경 밖 점들의 연속 구간만 살려 획을 쪼갠다.
            let points = resampled(stroke.points, spacing: max(3, radius * 0.6))
            var run: [StrokePoint] = []
            for p in points {
                if hypot(p.location.x - point.x, p.location.y - point.y) > radius {
                    run.append(p)
                } else {
                    if run.count >= 2 {
                        var piece = stroke
                        piece.points = run
                        next.append(piece)
                    }
                    run = []
                }
            }
            if run.count >= 2 {
                var piece = stroke
                piece.points = run
                next.append(piece)
            }
        }

        return Result(changed: changed, strokes: next)
    }

    private static func hits(_ stroke: Stroke, _ at: CGPoint, _ radius: CGFloat) -> Bool {
        let pts = stroke.points
        guard pts.count > 1 else {
            guard let only = pts.first else { return false }
            return hypot(only.location.x - at.x, only.location.y - at.y) <= radius
        }
        for i in 1..<pts.count {
            if distanceToSegment(at, pts[i - 1].location, pts[i].location) <= radius {
                return true
            }
        }
        return false
    }

    private static func distanceToSegment(_ p: CGPoint, _ a: CGPoint, _ b: CGPoint) -> CGFloat {
        let dx = b.x - a.x, dy = b.y - a.y
        let len2 = dx * dx + dy * dy
        if len2 == 0 { return hypot(p.x - a.x, p.y - a.y) }
        var t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
        t = max(0, min(1, t))
        return hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
    }

    /// 이웃 점 간격이 spacing 이하가 되도록 보간해 채운다.
    private static func resampled(_ points: [StrokePoint], spacing: CGFloat) -> [StrokePoint] {
        guard let first = points.first else { return [] }
        var out: [StrokePoint] = [first]
        for i in 1..<points.count {
            let a = points[i - 1], b = points[i]
            let distance = hypot(b.location.x - a.location.x, b.location.y - a.location.y)
            let n = max(1, min(1000, Int((distance / spacing).rounded(.up))))
            for k in 1...n {
                let t = CGFloat(k) / CGFloat(n)
                out.append(StrokePoint(
                    location: CGPoint(
                        x: a.location.x + (b.location.x - a.location.x) * t,
                        y: a.location.y + (b.location.y - a.location.y) * t
                    ),
                    pressure: a.pressure + (b.pressure - a.pressure) * t
                ))
            }
        }
        return out
    }
}
