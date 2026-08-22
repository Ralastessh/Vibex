import CoreGraphics

/// 올가미 폴리곤 판정.
enum Lasso {

    /// 점이 폴리곤 안에 있는지 (even-odd ray casting).
    static func contains(_ polygon: [CGPoint], _ p: CGPoint) -> Bool {
        var inside = false
        var j = polygon.count - 1
        for i in 0..<polygon.count {
            let a = polygon[i], b = polygon[j]
            if (a.y > p.y) != (b.y > p.y),
               p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x {
                inside.toggle()
            }
            j = i
        }
        return inside
    }

    /// 폴리곤에 점이 하나라도 들어간 획들의 인덱스.
    static func strokesInside(_ strokes: [Stroke], polygon: [CGPoint]) -> Set<Int> {
        guard polygon.count >= 3 else { return [] }
        var result: Set<Int> = []
        for (i, stroke) in strokes.enumerated() {
            if stroke.points.contains(where: { contains(polygon, $0.location) }) {
                result.insert(i)
            }
        }
        return result
    }
}
