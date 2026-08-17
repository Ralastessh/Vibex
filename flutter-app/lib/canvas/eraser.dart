import 'dart:math';
import 'dart:ui';

import 'stroke.dart';

/// 지우개 한 점 적용. 판정은 점이 아니라 **선분** 기준이라
/// 점이 성긴 획(스냅된 직선 등)도 중간 아무 데나 닿으면 지워진다.

class EraseResult {
  const EraseResult(this.changed, this.strokes);
  final bool changed;
  final List<Stroke> strokes;
}

EraseResult eraseAt(
    List<Stroke> strokes, Offset at, double radius, EraserMode mode) {
  final next = <Stroke>[];
  var changed = false;

  for (final stroke in strokes) {
    if (!_strokeHit(stroke, at, radius)) {
      next.add(stroke);
      continue;
    }
    changed = true;
    if (mode == EraserMode.object) continue; // 통째로 삭제

    // 일부 지우기: 반경보다 촘촘히 리샘플한 뒤,
    // 반경 밖 점들의 연속 구간만 살려 획을 쪼갠다.
    final points = _resampled(stroke.points, max(3, radius * 0.6));
    var run = <StrokePoint>[];
    for (final p in points) {
      if ((p.offset - at).distance > radius) {
        run.add(p);
      } else {
        if (run.length >= 2) next.add(stroke.copyWith(points: run));
        run = <StrokePoint>[];
      }
    }
    if (run.length >= 2) next.add(stroke.copyWith(points: run));
  }

  return EraseResult(changed, next);
}

bool _strokeHit(Stroke stroke, Offset at, double radius) {
  final pts = stroke.points;
  if (pts.length == 1) return (pts.first.offset - at).distance <= radius;
  for (var i = 1; i < pts.length; i++) {
    if (_distToSegment(at, pts[i - 1].offset, pts[i].offset) <= radius) {
      return true;
    }
  }
  return false;
}

double _distToSegment(Offset p, Offset a, Offset b) {
  final ab = b - a;
  final len2 = ab.dx * ab.dx + ab.dy * ab.dy;
  if (len2 == 0) return (p - a).distance;
  final t =
      (((p.dx - a.dx) * ab.dx + (p.dy - a.dy) * ab.dy) / len2).clamp(0.0, 1.0);
  return (p - (a + ab * t)).distance;
}

/// 이웃 점 간격이 spacing 이하가 되도록 보간해 채운다.
List<StrokePoint> _resampled(List<StrokePoint> points, double spacing) {
  final out = <StrokePoint>[points.first];
  for (var i = 1; i < points.length; i++) {
    final a = points[i - 1], b = points[i];
    final n = ((b.offset - a.offset).distance / spacing).ceil().clamp(1, 1000);
    for (var k = 1; k <= n; k++) {
      out.add(StrokePoint(
        Offset.lerp(a.offset, b.offset, k / n)!,
        a.pressure + (b.pressure - a.pressure) * k / n,
      ));
    }
  }
  return out;
}
