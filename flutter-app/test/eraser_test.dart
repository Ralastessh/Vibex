import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:vibex/canvas/eraser.dart';
import 'package:vibex/canvas/stroke.dart';

/// 스냅된 직선처럼 점이 2개뿐인 획.
Stroke _sparseLine(Offset a, Offset b) => Stroke(
      kind: PenKind.pen,
      color: const Color(0xFF111111),
      width: 3,
      points: [StrokePoint(a, 1), StrokePoint(b, 1)],
    );

void main() {
  test('점 2개 직선: 중간만 닿아도 전체 삭제(object)', () {
    final strokes = [_sparseLine(const Offset(0, 0), const Offset(300, 0))];
    final r = eraseAt(strokes, const Offset(150, 5), 12, EraserMode.object);
    expect(r.changed, isTrue);
    expect(r.strokes, isEmpty);
  });

  test('점 2개 직선: 중간을 지우면 둘로 쪼개짐(pixel)', () {
    final strokes = [_sparseLine(const Offset(0, 0), const Offset(300, 0))];
    final r = eraseAt(strokes, const Offset(150, 0), 12, EraserMode.pixel);
    expect(r.changed, isTrue);
    expect(r.strokes.length, 2);
    // 지운 자리(x≈150) 근처엔 점이 없어야 한다.
    for (final s in r.strokes) {
      for (final p in s.points) {
        expect((p.offset - const Offset(150, 0)).distance, greaterThan(12));
      }
    }
  });

  test('선분에서 먼 곳은 아무 일 없음', () {
    final strokes = [_sparseLine(const Offset(0, 0), const Offset(300, 0))];
    final r = eraseAt(strokes, const Offset(150, 40), 12, EraserMode.pixel);
    expect(r.changed, isFalse);
    expect(r.strokes.length, 1);
  });
}
