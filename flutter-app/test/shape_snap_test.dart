import 'dart:math';

import 'package:flutter_test/flutter_test.dart';
import 'package:vibex/canvas/shape_snap.dart';

void main() {
  test('손으로 그린 듯 떨리는 원을 원으로 스냅', () {
    final rand = Random(7);
    final points = [
      for (var i = 0; i <= 60; i++)
        Offset(
          200 + (100 + rand.nextDouble() * 12 - 6) * cos(i / 60 * 2 * pi),
          200 + (100 + rand.nextDouble() * 12 - 6) * sin(i / 60 * 2 * pi),
        ),
    ];
    final snapped = ShapeSnap.snap(points);
    expect(snapped, isNotNull);
    expect(snapped!.kind, ShapeKind.circle);
  });

  test('직사각형 궤적을 사각형으로 스냅 (원으로 오인 금지)', () {
    final points = <Offset>[];
    const x0 = 100.0, y0 = 100.0, x1 = 340.0, y1 = 240.0;
    for (var i = 0; i < 20; i++) {
      points.add(Offset(x0 + (x1 - x0) * i / 20, y0));
    }
    for (var i = 0; i < 20; i++) {
      points.add(Offset(x1, y0 + (y1 - y0) * i / 20));
    }
    for (var i = 0; i < 20; i++) {
      points.add(Offset(x1 - (x1 - x0) * i / 20, y1));
    }
    for (var i = 0; i < 20; i++) {
      points.add(Offset(x0, y1 - (y1 - y0) * i / 20));
    }
    final snapped = ShapeSnap.snap(points);
    expect(snapped, isNotNull);
    expect(snapped!.kind, ShapeKind.rectangle);
  });

  test('정사각형 궤적은 정사각형 (원 판정에 새지 않음)', () {
    final points = <Offset>[];
    const x0 = 100.0, y0 = 100.0, x1 = 300.0, y1 = 300.0;
    for (var i = 0; i < 20; i++) {
      points.add(Offset(x0 + (x1 - x0) * i / 20, y0));
    }
    for (var i = 0; i < 20; i++) {
      points.add(Offset(x1, y0 + (y1 - y0) * i / 20));
    }
    for (var i = 0; i < 20; i++) {
      points.add(Offset(x1 - (x1 - x0) * i / 20, y1));
    }
    for (var i = 0; i < 20; i++) {
      points.add(Offset(x0, y1 - (y1 - y0) * i / 20));
    }
    final snapped = ShapeSnap.snap(points);
    expect(snapped, isNotNull);
    expect(snapped!.kind, ShapeKind.square);
  });

  test('삐뚤한 직선을 직선으로 스냅', () {
    final points = [
      for (var i = 0; i <= 30; i++)
        Offset(100 + i * 10.0, 200 + sin(i / 4) * 6),
    ];
    final snapped = ShapeSnap.snap(points);
    expect(snapped, isNotNull);
    expect(snapped!.kind, ShapeKind.line);
    expect(snapped.outline.length, 2);
  });

  test('작은 낙서는 스냅하지 않음', () {
    final points = [
      for (var i = 0; i < 10; i++) Offset(100 + i * 2.0, 100 + i % 3 * 2.0),
    ];
    expect(ShapeSnap.snap(points), isNull);
  });

  test('한 획으로 그린 샤프트+화살촉을 화살표로 스냅', () {
    // 샤프트 (100,100)→(400,250), 이어서 화살촉 갈래 두 번.
    const a = Offset(100, 100), t = Offset(400, 250);
    const b1 = Offset(350, 215), b2 = Offset(355, 290);
    final points = <Offset>[
      for (var i = 0; i <= 40; i++) Offset.lerp(a, t, i / 40)!,
      for (var i = 1; i <= 10; i++) Offset.lerp(t, b1, i / 10)!,
      for (var i = 1; i <= 10; i++) Offset.lerp(b1, t, i / 10)!,
      for (var i = 1; i <= 10; i++) Offset.lerp(t, b2, i / 10)!,
    ];
    final snapped = ShapeSnap.snap(points);
    expect(snapped, isNotNull);
    expect(snapped!.kind, ShapeKind.arrow);
    // 방향 보존: 시작점에서 출발.
    expect((snapped.outline.first - a).distance, lessThan(1));
  });

  test('큰 V자는 화살표로 오인하지 않음', () {
    const a = Offset(100, 100), v = Offset(250, 300), b = Offset(400, 100);
    final points = <Offset>[
      for (var i = 0; i <= 30; i++) Offset.lerp(a, v, i / 30)!,
      for (var i = 1; i <= 30; i++) Offset.lerp(v, b, i / 30)!,
    ];
    final snapped = ShapeSnap.snap(points);
    expect(snapped?.kind, isNot(ShapeKind.arrow));
  });

  test('화살표: 시작·끝 보존, 화살촉 두 갈래 생성', () {
    const a = Offset(100, 100), b = Offset(300, 200);
    final outline = ShapeSnap.arrow(a, b);
    expect(outline.first, a);
    // 끝점 b가 아웃라인에 포함되고, b 근처에 화살촉 갈래가 있다.
    expect(outline.any((p) => (p - b).distance < 0.5), isTrue);
    final headPoints =
        outline.where((p) => (p - b).distance > 5 && (p - b).distance < 35);
    expect(headPoints.length, greaterThan(2));
  });
}
