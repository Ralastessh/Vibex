import 'dart:math';
import 'dart:ui';

/// 손그림 획을 깔끔한 도형으로 스냅 (네모·정사각형·원·타원·삼각형·직선).
/// ipad-app/ShapeSnap.swift의 Dart 이식.

enum ShapeKind { rectangle, square, circle, ellipse, triangle, line, arrow }

class SnappedShape {
  const SnappedShape(this.kind, this.outline);
  final ShapeKind kind;
  final List<Offset> outline;
}

class ShapeSnap {
  ShapeSnap._();

  static const _edgeSamples = 12;
  static const _ellipseSamples = 60;

  /// 점 목록을 도형으로 스냅. 인식 실패 시 null.
  static SnappedShape? snap(List<Offset> points) {
    if (points.length < 8) return null;

    var minX = double.infinity, minY = double.infinity;
    var maxX = -double.infinity, maxY = -double.infinity;
    for (final p in points) {
      minX = min(minX, p.dx);
      minY = min(minY, p.dy);
      maxX = max(maxX, p.dx);
      maxY = max(maxY, p.dy);
    }
    final w = maxX - minX;
    final h = maxY - minY;
    final diag = sqrt(w * w + h * h);
    if (diag < 40) return null; // 너무 작으면 도형으로 보지 않음

    final first = points.first;
    final last = points.last;
    final gap = (last - first).distance;
    final closed = gap < 0.33 * max(w, h);

    // ── 열린 획: 직선인가 ──────────────────────────────
    if (!closed) {
      final lineLen = (last - first).distance;
      var maxDev = 0.0;
      for (final p in points) {
        maxDev = max(maxDev, _perpDistance(p, first, last));
      }
      if (lineLen > 0 && maxDev < 0.09 * lineLen) {
        return SnappedShape(ShapeKind.line, [first, last]);
      }

      // ── 화살표: 긴 샤프트 + 끝에 모인 화살촉 꼭짓점들 ──
      final corners = _rdp(points, 0.045 * diag);
      if (corners.length >= 3 && corners.length <= 6) {
        final start = corners[0];
        final tip = corners[1];
        final shaft = (tip - start).distance;
        final headDists = [for (final c in corners.skip(2)) (c - tip).distance];
        final headOk = headDists.every((d) => d <= 0.45 * shaft);
        final headBigEnough =
            headDists.any((d) => d >= max(0.1 * shaft, 12)); // 우발적 꺾임 제외
        if (shaft >= 0.5 * diag && headOk && headBigEnough) {
          return SnappedShape(ShapeKind.arrow, arrow(start, tip));
        }
      }
      return null;
    }

    final cx = (minX + maxX) / 2;
    final cy = (minY + maxY) / 2;
    final rx = w / 2;
    final ry = h / 2;
    final squareish = (w - h).abs() / max(w, h) < 0.18;

    // ── 타원 / 원 검사 ────────────────────────────────
    // 정규화 반경 평균은 원·타원이 ≈1.0, 사각형이 ≈1.15. mean으로 사각형을
    // 걸러내고 std(떨림)는 넉넉히 둬서 손으로 대충 그린 원도 잡는다.
    if (rx > 4 && ry > 4) {
      var sum = 0.0, sum2 = 0.0;
      for (final p in points) {
        final nx = (p.dx - cx) / rx;
        final ny = (p.dy - cy) / ry;
        final r = sqrt(nx * nx + ny * ny);
        sum += r;
        sum2 += r * r;
      }
      final n = points.length.toDouble();
      final mean = sum / n;
      final std = sqrt(max(0, sum2 / n - mean * mean));
      if (mean > 0.88 && mean < 1.12 && std < 0.18) {
        if (squareish) {
          final r = (rx + ry) / 2;
          return SnappedShape(ShapeKind.circle, _ellipsePoints(cx, cy, r, r));
        }
        return SnappedShape(ShapeKind.ellipse, _ellipsePoints(cx, cy, rx, ry));
      }
    }

    // ── 코너 검사 (RDP) ───────────────────────────────
    var corners = _rdp(points, 0.06 * diag);
    // 닫힘으로 인한 시작=끝 중복 제거
    if (corners.length > 1 &&
        (corners.first - corners.last).distance < 0.12 * diag) {
      corners = corners.sublist(0, corners.length - 1);
    }
    // 너무 가까운 꼭짓점 병합
    final merged = <Offset>[];
    for (final c in corners) {
      if (merged.isEmpty || (c - merged.last).distance > 0.13 * diag) {
        merged.add(c);
      }
    }

    if (merged.length == 3) {
      return SnappedShape(ShapeKind.triangle, _polygonPoints(merged));
    }
    if (merged.length == 4) {
      // 직사각형 → 축 정렬 bbox. 정사각형에 가까우면 정사각형.
      var x0 = minX, y0 = minY, x1 = maxX, y1 = maxY;
      var kind = ShapeKind.rectangle;
      if (squareish) {
        final side = (w + h) / 2;
        x0 = cx - side / 2;
        x1 = cx + side / 2;
        y0 = cy - side / 2;
        y1 = cy + side / 2;
        kind = ShapeKind.square;
      }
      final rect = [
        Offset(x0, y0),
        Offset(x1, y0),
        Offset(x1, y1),
        Offset(x0, y1),
      ];
      return SnappedShape(kind, _polygonPoints(rect));
    }

    return null; // 인식 실패 → 원래 자유곡선을 그대로 둔다
  }

  /// 직선 화살표 아웃라인(샤프트 + 화살촉). a→b 방향, 단일 폴리라인.
  static List<Offset> arrow(Offset a, Offset b) {
    final d = b - a;
    final len = d.distance;
    if (len == 0) return [a, b];
    final ux = d.dx / len, uy = d.dy / len;
    final head = (len * 0.22).clamp(12.0, 30.0);
    final c = cos(pi / 7), s = sin(pi / 7); // ≈25.7°
    // 끝점에서 ±각도로 뻗은 두 갈래. a→b→b1→b→b2 한 획으로 그린다.
    final b1 = Offset(
        b.dx - head * (ux * c - uy * s), b.dy - head * (uy * c + ux * s));
    final b2 = Offset(
        b.dx - head * (ux * c + uy * s), b.dy - head * (uy * c - ux * s));
    return _densify([a, b, b1, b, b2]);
  }

  // ── 기하 헬퍼 ──────────────────────────────────────

  static double _perpDistance(Offset p, Offset a, Offset b) {
    final dx = b.dx - a.dx, dy = b.dy - a.dy;
    final len2 = dx * dx + dy * dy;
    if (len2 == 0) return (p - a).distance;
    var t = ((p.dx - a.dx) * dx + (p.dy - a.dy) * dy) / len2;
    t = t.clamp(0.0, 1.0);
    return (p - Offset(a.dx + t * dx, a.dy + t * dy)).distance;
  }

  /// Ramer–Douglas–Peucker 단순화
  static List<Offset> _rdp(List<Offset> pts, double eps) {
    if (pts.length < 3) return List.of(pts);
    var maxD = 0.0;
    var idx = 0;
    for (var i = 1; i < pts.length - 1; i++) {
      final d = _perpDistance(pts[i], pts.first, pts.last);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > eps) {
      final left = _rdp(pts.sublist(0, idx + 1), eps);
      final right = _rdp(pts.sublist(idx), eps);
      return [...left.sublist(0, left.length - 1), ...right];
    }
    return [pts.first, pts.last];
  }

  static List<Offset> _edgePoints(Offset a, Offset b) => [
        for (var i = 0; i < _edgeSamples; i++)
          Offset.lerp(a, b, i / _edgeSamples)!,
      ];

  static List<Offset> _polygonPoints(List<Offset> corners) {
    final out = <Offset>[];
    for (var i = 0; i < corners.length; i++) {
      out.addAll(_edgePoints(corners[i], corners[(i + 1) % corners.length]));
    }
    out.add(corners.first); // 닫기
    return out;
  }

  /// 꼭짓점 사이를 촘촘한 점으로 채운 열린 폴리라인.
  static List<Offset> _densify(List<Offset> corners) {
    if (corners.length < 2) return corners;
    final out = <Offset>[];
    for (var i = 0; i < corners.length - 1; i++) {
      out.addAll(_edgePoints(corners[i], corners[i + 1]));
    }
    out.add(corners.last);
    return out;
  }

  static List<Offset> _ellipsePoints(
      double cx, double cy, double rx, double ry) {
    return [
      for (var i = 0; i <= _ellipseSamples; i++)
        Offset(cx + rx * cos(i / _ellipseSamples * 2 * pi),
            cy + ry * sin(i / _ellipseSamples * 2 * pi)),
    ];
  }
}
