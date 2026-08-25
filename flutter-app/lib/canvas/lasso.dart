import 'dart:ui';

import 'stroke.dart';

/// 올가미 폴리곤 판정.

/// 점이 폴리곤 안에 있는지 (even-odd ray casting).
bool pointInPolygon(Offset p, List<Offset> poly) {
  var inside = false;
  for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    final a = poly[i], b = poly[j];
    if ((a.dy > p.dy) != (b.dy > p.dy)) {
      final x = a.dx + (p.dy - a.dy) / (b.dy - a.dy) * (b.dx - a.dx);
      if (p.dx < x) inside = !inside;
    }
  }
  return inside;
}

/// 폴리곤에 점이 하나라도 들어간 획들의 인덱스.
Set<int> strokesInside(List<Stroke> strokes, List<Offset> lasso) {
  if (lasso.length < 3) return {};
  return {
    for (var i = 0; i < strokes.length; i++)
      if (strokes[i].points.any((p) => pointInPolygon(p.offset, lasso))) i,
  };
}
