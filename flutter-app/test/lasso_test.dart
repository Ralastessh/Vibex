import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:vibex/canvas/lasso.dart';
import 'package:vibex/canvas/stroke.dart';

Stroke _line(Offset a, Offset b) => Stroke(
      kind: PenKind.pen,
      color: const Color(0xFF111111),
      width: 3,
      points: [
        for (var i = 0; i <= 10; i++) StrokePoint(Offset.lerp(a, b, i / 10)!, 1),
      ],
    );

void main() {
  final strokes = [
    _line(const Offset(50, 50), const Offset(90, 90)),
    _line(const Offset(300, 300), const Offset(350, 350)),
  ];

  test('올가미 폴리곤 안의 획만 선택', () {
    final lasso = [
      const Offset(0, 0),
      const Offset(150, 0),
      const Offset(150, 150),
      const Offset(0, 150),
    ];
    expect(strokesInside(strokes, lasso), {0});
  });

  test('아무것도 안 감싸면 빈 선택', () {
    final lasso = [
      const Offset(400, 0),
      const Offset(450, 0),
      const Offset(450, 50),
    ];
    expect(strokesInside(strokes, lasso), isEmpty);
  });

  test('점 3개 미만 올가미는 무시', () {
    expect(strokesInside(strokes, [const Offset(0, 0), const Offset(500, 500)]),
        isEmpty);
  });
}
