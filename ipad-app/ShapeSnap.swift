import CoreGraphics
import Foundation

/// 손그림 획을 깔끔한 도형으로 스냅 (네모·정사각형·원·타원·삼각형·직선·화살표).

enum ShapeKind {
    case rectangle, square, circle, ellipse, triangle, line, arrow
}

struct SnappedShape {
    let kind: ShapeKind
    let outline: [CGPoint]
}

enum ShapeSnap {
    private static let edgeSamples = 12
    private static let ellipseSamples = 60

    /// 점 목록을 도형으로 스냅.
    //  인식 실패 시 nil.
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
        guard diag >= 40 else { return nil } // 너무 작으면 도형으로 보지 않음

        let first = points.first!
        let last = points.last!
        let gap = hypot(last.x - first.x, last.y - first.y)
        let closed = gap < 0.33 * max(w, h)

        // ── 열린 획: 직선인가 ──────────────────────────────
        if !closed {
            let lineLen = hypot(last.x - first.x, last.y - first.y)
            var maxDev: CGFloat = 0
            for p in points { maxDev = max(maxDev, perpDistance(p, first, last)) }
            if lineLen > 0 && maxDev < 0.09 * lineLen {
                return SnappedShape(kind: .line, outline: [first, last])
            }

            // ── 화살표: 긴 샤프트 + 끝에 모인 화살촉 꼭짓점들 ──
            let corners = rdp(points, 0.045 * diag)
            if corners.count >= 3, corners.count <= 6 {
                let start = corners[0]
                let tip = corners[1]
                let shaft = hypot(tip.x - start.x, tip.y - start.y)
                let headDists = corners.dropFirst(2).map { hypot($0.x - tip.x, $0.y - tip.y) }
                let headOk = headDists.allSatisfy { $0 <= 0.45 * shaft }
                // 우발적 꺾임 제외 — 화살촉이라 부를 만큼은 커야 한다.
                let headBigEnough = headDists.contains { $0 >= max(0.1 * shaft, 12) }
                if shaft >= 0.5 * diag, headOk, headBigEnough {
                    return SnappedShape(kind: .arrow, outline: arrow(from: start, to: tip))
                }
            }
            return nil
        }

        let cx = (minX + maxX) / 2
        let cy = (minY + maxY) / 2
        let rx = w / 2
        let ry = h / 2
        let squareish = abs(w - h) / max(w, h) < 0.18

        // ── 타원 / 원 검사 ────────────────────────────────
        // 정규화 반경 평균은 원·타원이 ≈1.0, 사각형이 ≈1.15. mean으로 사각형을
        // 걸러내고 std(떨림)는 넉넉히 둬서 손으로 대충 그린 원도 잡는다.
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

        // ── 코너 검사 (RDP) ───────────────────────────────
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
            // 직사각형 → 축 정렬 bbox. 정사각형에 가까우면 정사각형.
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

        return nil // 인식 실패 → 원래 자유곡선을 그대로 둔다
    }

    /// 직선 화살표 아웃라인(샤프트 + 화살촉). a→b 방향, 단일 폴리라인으로 그림.
    static func arrow(from a: CGPoint, to b: CGPoint) -> [CGPoint] {
        let dx = b.x - a.x, dy = b.y - a.y
        let len = hypot(dx, dy)
        guard len > 0 else { return [a, b] }
        let ux = dx / len, uy = dy / len
        let head = min(max(len * 0.22, 12), 30)
        let c = cos(CGFloat.pi / 7), s = sin(CGFloat.pi / 7) // ≈25.7°
        // 끝점에서 ±각도로 뻗은 두 갈래. a→b→b1→b→b2 한 획으로 그린다.
        let b1 = CGPoint(x: b.x - head * (ux * c - uy * s), y: b.y - head * (uy * c + ux * s))
        let b2 = CGPoint(x: b.x - head * (ux * c + uy * s), y: b.y - head * (uy * c - ux * s))
        return densify([a, b, b1, b, b2])
    }

    // MARK: - 기하 헬퍼

    /// 꼭짓점 사이를 촘촘한 점으로 채운 열린 폴리라인.
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

    /// Ramer–Douglas–Peucker 단순화
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
