import 'dart:math';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/painting.dart';

import 'stroke.dart';

/// 획 그리기 공용 로직. 화면 페인터와 전송용 PNG가 같이 쓴다.

void paintStrokes(Canvas canvas, List<Stroke> strokes) {
  for (final s in strokes) {
    paintStroke(canvas, s.kind, s.color, s.width, s.points);
  }
}

void paintStroke(Canvas canvas, PenKind kind, Color color, double width,
    List<StrokePoint> points) {
  if (points.length < 2) return;

  if (kind == PenKind.marker) {
    // 형광펜: 굵고 반투명, 균일 굵기.
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..color = color.withValues(alpha: 0.35)
      ..strokeWidth = max(width * 3, 16);
    final path = Path()..moveTo(points.first.offset.dx, points.first.offset.dy);
    for (final p in points.skip(1)) {
      path.lineTo(p.offset.dx, p.offset.dy);
    }
    canvas.drawPath(path, paint);
    return;
  }

  // 펜: 필압으로 구간별 굵기를 바꾼 짧은 선분들.
  final paint = Paint()
    ..style = PaintingStyle.stroke
    ..strokeCap = StrokeCap.round
    ..color = color;
  for (var i = 1; i < points.length; i++) {
    final a = points[i - 1], b = points[i];
    final pressure = (a.pressure + b.pressure) / 2;
    paint.strokeWidth = width * (0.5 + 0.9 * pressure);
    canvas.drawLine(a.offset, b.offset, paint);
  }
}

/// 업로드 한 장의 최대 변(픽셀). 더 키워도 정확도는 안 오르고 업로드만 느려진다.
const double kMaxPixelDimension = 2048;

/// 획만 있는 투명 배경 PNG. 서버의 `canvasImage`와 같은 형식.
Future<Uint8List?> strokesToPng(
  List<Stroke> strokes,
  Size size, {
  double displayScale = 2,
}) async {
  if (size.width <= 0 || size.height <= 0) return null;
  final longest = max(size.width, size.height);
  final scale = max(1.0, min(displayScale, kMaxPixelDimension / longest));

  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder)..scale(scale);
  paintStrokes(canvas, strokes);
  final image = await recorder.endRecording().toImage(
        (size.width * scale).round(),
        (size.height * scale).round(),
      );
  final data = await image.toByteData(format: ui.ImageByteFormat.png);
  image.dispose();
  return data?.buffer.asUint8List();
}
