// 손으로 그린 점들을 사각형, 원, 삼각형, 직선 같은 반듯한 도형으로 변환
import CoreGraphics
import Foundation

enum ShapeKind {
    case rectangle, square, circle, ellipse, triangle, line
}

struct SnappedShape {
    let kind: ShapeKind
    let outline: [CGPoint]
}

struct SnappedArrow {
    let from: CGPoint
    let to: CGPoint
}

enum ShapeSnap {
    private static let edgeSamples = 12
    private static let ellipseSamples = 60

    static func snap(_ points: [CGPoint]) -> SnappedShape? {
        guard points.count >= 8 else { return nil }

        var minX = CGFloat.greatestFiniteMagnitude
        var minY = CGFloat.greatestFiniteMagnitude
        var maxX = -CGFloat.greatestFiniteMagnitude
        var maxY = -CGFloat.greatestFiniteMagnitude
        for p in points {
            minX = min(minX, p.x); minY = min(minY, p.y)
            maxX = max(maxX, p.x); maxY = max(maxY, p.y)
        }
        let w = maxX - minX
        let h = maxY - minY
        let diag = hypot(w, h)
        guard diag >= 40 else { return nil }

        let first = points.first!
        let last = points.last!
        let gap = hypot(last.x - first.x, last.y - first.y)
        let closed = gap < 0.33 * max(w, h)

        // 직선 여부
        if !closed {
            let lineLen = hypot(last.x - first.x, last.y - first.y)
            var maxDev: CGFloat = 0
            for p in points { maxDev = max(maxDev, perpDistance(p, first, last)) }
            if lineLen > 0 && maxDev < 0.09 * lineLen {
                return SnappedShape(kind: .line, outline: [first, last])
            }
            return nil
        }

        let cx = (minX + maxX) / 2
        let cy = (minY + maxY) / 2
        let rx = w / 2
        let ry = h / 2
        let squareish = abs(w - h) / max(w, h) < 0.18

        // 타원 여부
        if rx > 4 && ry > 4 {
            var sum: CGFloat = 0
            var sum2: CGFloat = 0
            for p in points {
                let r = hypot((p.x - cx) / rx, (p.y - cy) / ry)
                sum += r
                sum2 += r * r
            }
            let n = CGFloat(points.count)
            let mean = sum / n
            let std = (max(0, sum2 / n - mean * mean)).squareRoot()
            if mean > 0.88 && mean < 1.12 && std < 0.18 {
                if squareish {
                    let r = (rx + ry) / 2
                    return SnappedShape(kind: .circle, outline: ellipsePoints(cx, cy, r, r))
                }
                return SnappedShape(kind: .ellipse, outline: ellipsePoints(cx, cy, rx, ry))
            }
        }

        // 코너 검사
        var corners = rdp(points, 0.06 * diag)
        // 닫힘으로 인한 시작=끝 중복 제거
        if corners.count > 1,
           hypot(corners[0].x - corners[corners.count - 1].x,
                 corners[0].y - corners[corners.count - 1].y) < 0.12 * diag {
            corners.removeLast()
        }
        // 너무 가까운 꼭짓점 병합
        var merged: [CGPoint] = []
        for c in corners {
            if let prev = merged.last {
                if hypot(c.x - prev.x, c.y - prev.y) > 0.13 * diag { merged.append(c) }
            } else {
                merged.append(c)
            }
        }

        if merged.count == 3 {
            return SnappedShape(kind: .triangle, outline: polygonPoints(merged))
        }
        if merged.count == 4 {
            var x0 = minX, y0 = minY, x1 = maxX, y1 = maxY
            var kind = ShapeKind.rectangle
            if squareish {
                let side = (w + h) / 2
                x0 = cx - side / 2; x1 = cx + side / 2
                y0 = cy - side / 2; y1 = cy + side / 2
                kind = .square
            }
            let rect = [
                CGPoint(x: x0, y: y0), CGPoint(x: x1, y: y0),
                CGPoint(x: x1, y: y1), CGPoint(x: x0, y: y1),
            ]
            return SnappedShape(kind: kind, outline: polygonPoints(rect))
        }

        return nil
    }

    static func snapArrow(_ points: [CGPoint]) -> SnappedArrow? {
        guard let bounds = metrics(points), bounds.diag >= 40 else { return nil }
        let simplified = rdp(points, 0.035 * bounds.diag)
        guard simplified.count >= 5 && simplified.count <= 8 else { return nil }

        let tail = simplified[0]
        let firstTip = simplified[1]
        let secondTip = simplified[simplified.count - 2]
        let tip = CGPoint(
            x: (firstTip.x + secondTip.x) / 2,
            y: (firstTip.y + secondTip.y) / 2
        )
        let shaftLength = distance(tail, tip)
        guard shaftLength >= 32,
              distance(firstTip, secondTip) <= max(16, shaftLength * 0.16)
        else { return nil }

        let firstWing = simplified[2]
        let secondWing = simplified.last!
        guard validArrowHead(
            tail: tail,
            tip: tip,
            firstWing: firstWing,
            secondWing: secondWing,
            shaftLength: shaftLength
        ) else { return nil }
        return SnappedArrow(from: tail, to: tip)
    }

    static func snapArrow(shaft: [CGPoint], head: [CGPoint]) -> SnappedArrow? {
        guard shaft.count >= 2, head.count >= 3 else { return nil }
        let shaftStart = shaft.first!
        let shaftEnd = shaft.last!
        let shaftLength = distance(shaftStart, shaftEnd)
        guard shaftLength >= 32 else { return nil }
        let maxDeviation = shaft.map { perpDistance($0, shaftStart, shaftEnd) }.max() ?? 0
        guard maxDeviation <= max(5, shaftLength * 0.1) else { return nil }

        let headBounds = metrics(head)
        guard let headBounds, headBounds.diag >= 16 else { return nil }
        let simplified = rdp(head, 0.045 * headBounds.diag)
        guard simplified.count == 3 else { return nil }
        let vertex = simplified[1]
        let firstWing = simplified[0]
        let secondWing = simplified[2]

        let endIsTip = distance(shaftEnd, vertex) <= distance(shaftStart, vertex)
        let tail = endIsTip ? shaftStart : shaftEnd
        let endpoint = endIsTip ? shaftEnd : shaftStart
        guard distance(endpoint, vertex) <= max(18, shaftLength * 0.14) else { return nil }
        let tip = CGPoint(x: (endpoint.x + vertex.x) / 2, y: (endpoint.y + vertex.y) / 2)
        guard validArrowHead(
            tail: tail,
            tip: tip,
            firstWing: firstWing,
            secondWing: secondWing,
            shaftLength: shaftLength
        ) else { return nil }
        return SnappedArrow(from: tail, to: tip)
    }

    static func arrow(from a: CGPoint, to b: CGPoint) -> [CGPoint] {
        let dx = b.x - a.x, dy = b.y - a.y
        let len = hypot(dx, dy)
        guard len > 0 else { return [a, b] }
        let ux = dx / len, uy = dy / len
        let head = min(max(len * 0.22, 12), 30)
        let c = cos(CGFloat.pi / 7), s = sin(CGFloat.pi / 7) // ≈25.7°
        let b1 = CGPoint(x: b.x - head * (ux * c - uy * s), y: b.y - head * (uy * c + ux * s))
        let b2 = CGPoint(x: b.x - head * (ux * c + uy * s), y: b.y - head * (uy * c - ux * s))
        return densify([a, b, b1, b, b2])
    }


    private static func densify(_ corners: [CGPoint]) -> [CGPoint] {
        guard corners.count >= 2 else { return corners }
        var out: [CGPoint] = []
        for i in 0..<(corners.count - 1) {
            out += edgePoints(corners[i], corners[i + 1])
        }
        out.append(corners[corners.count - 1])
        return out
    }

    private static func perpDistance(_ p: CGPoint, _ a: CGPoint, _ b: CGPoint) -> CGFloat {
        let dx = b.x - a.x
        let dy = b.y - a.y
        let len2 = dx * dx + dy * dy
        if len2 == 0 { return hypot(p.x - a.x, p.y - a.y) }
        var t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
        t = max(0, min(1, t))
        return hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
    }

    private static func validArrowHead(
        tail: CGPoint,
        tip: CGPoint,
        firstWing: CGPoint,
        secondWing: CGPoint,
        shaftLength: CGFloat
    ) -> Bool {
        let back = CGPoint(x: tail.x - tip.x, y: tail.y - tip.y)
        let wing1 = CGPoint(x: firstWing.x - tip.x, y: firstWing.y - tip.y)
        let wing2 = CGPoint(x: secondWing.x - tip.x, y: secondWing.y - tip.y)
        let firstLength = hypot(wing1.x, wing1.y)
        let secondLength = hypot(wing2.x, wing2.y)
        guard firstLength >= max(10, shaftLength * 0.08),
              secondLength >= max(10, shaftLength * 0.08),
              firstLength <= shaftLength * 0.52,
              secondLength <= shaftLength * 0.52
        else { return false }

        let backLength = max(hypot(back.x, back.y), 0.001)
        let cosine1 = (back.x * wing1.x + back.y * wing1.y) / (backLength * firstLength)
        let cosine2 = (back.x * wing2.x + back.y * wing2.y) / (backLength * secondLength)
        guard cosine1 > 0.3, cosine2 > 0.3, cosine1 < 0.99, cosine2 < 0.99 else { return false }
        let cross1 = back.x * wing1.y - back.y * wing1.x
        let cross2 = back.x * wing2.y - back.y * wing2.x
        return cross1 * cross2 < 0
    }

    private static func distance(_ a: CGPoint, _ b: CGPoint) -> CGFloat {
        hypot(a.x - b.x, a.y - b.y)
    }

    private static func metrics(_ points: [CGPoint]) -> (diag: CGFloat, width: CGFloat, height: CGFloat)? {
        guard let first = points.first else { return nil }
        var minX = first.x, maxX = first.x, minY = first.y, maxY = first.y
        for point in points.dropFirst() {
            minX = min(minX, point.x); maxX = max(maxX, point.x)
            minY = min(minY, point.y); maxY = max(maxY, point.y)
        }
        let width = maxX - minX
        let height = maxY - minY
        return (hypot(width, height), width, height)
    }


    private static func rdp(_ pts: [CGPoint], _ eps: CGFloat) -> [CGPoint] {
        guard pts.count >= 3 else { return pts }
        var maxD: CGFloat = 0
        var idx = 0
        for i in 1..<(pts.count - 1) {
            let d = perpDistance(pts[i], pts[0], pts[pts.count - 1])
            if d > maxD { maxD = d; idx = i }
        }
        if maxD > eps {
            let left = rdp(Array(pts[0...idx]), eps)
            let right = rdp(Array(pts[idx...]), eps)
            return Array(left.dropLast()) + right
        }
        return [pts[0], pts[pts.count - 1]]
    }

    private static func edgePoints(_ a: CGPoint, _ b: CGPoint) -> [CGPoint] {
        var out: [CGPoint] = []
        for i in 0..<edgeSamples {
            let t = CGFloat(i) / CGFloat(edgeSamples)
            out.append(CGPoint(x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t))
        }
        return out
    }

    private static func polygonPoints(_ corners: [CGPoint]) -> [CGPoint] {
        var out: [CGPoint] = []
        for i in 0..<corners.count {
            out += edgePoints(corners[i], corners[(i + 1) % corners.count])
        }
        out.append(corners[0]) // 닫기
        return out
    }

    private static func ellipsePoints(_ cx: CGFloat, _ cy: CGFloat, _ rx: CGFloat, _ ry: CGFloat) -> [CGPoint] {
        var out: [CGPoint] = []
        for i in 0...ellipseSamples {
            let t = CGFloat(i) / CGFloat(ellipseSamples) * 2 * .pi
            out.append(CGPoint(x: cx + rx * cos(t), y: cy + ry * sin(t)))
        }
        return out
    }
}
