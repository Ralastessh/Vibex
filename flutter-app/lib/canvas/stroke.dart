import 'dart:ui';

/// 툴바에서 고르는 도구.
enum PenKind { pen, marker, eraser, lasso }

/// 지우개 방식: 획 일부만(픽셀) vs 획 통째로(오브젝트).
enum EraserMode { pixel, object }

/// 현재 선택된 도구 상태.
class DrawTool {
  static const palette = [
    Color(0xFF111111),
    Color(0xFF2F6BFF),
    Color(0xFFE0564A),
    Color(0xFF1F9D55),
    Color(0xFFF59E0B),
    Color(0xFF8B5CF6),
  ];

  PenKind kind = PenKind.pen;
  Color color = palette[0];
  double width = 5;
  // 지우개는 펜과 굵기 척도가 달라 따로 둔다.
  double eraserWidth = 24;
  EraserMode eraserMode = EraserMode.pixel;

  bool get usesColor => kind == PenKind.pen || kind == PenKind.marker;
}

/// 획의 한 점. 필압은 0~1.
class StrokePoint {
  const StrokePoint(this.offset, this.pressure);
  final Offset offset;
  final double pressure;
}

/// 완성된 획 하나.
class Stroke {
  const Stroke({
    required this.kind,
    required this.color,
    required this.width,
    required this.points,
  });

  final PenKind kind;
  final Color color;
  final double width;
  final List<StrokePoint> points;

  Stroke copyWith({List<StrokePoint>? points, Color? color}) => Stroke(
        kind: kind,
        color: color ?? this.color,
        width: width,
        points: points ?? this.points,
      );
}
