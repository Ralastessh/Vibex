import 'dart:math';

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

import 'drawing_controller.dart';
import 'eraser.dart';
import 'lasso.dart';
import 'shape_snap.dart';
import 'stroke.dart';
import 'stroke_renderer.dart';

/// 직접 구현한 필기 캔버스.
/// 스타일러스 필압·팜 리젝션·지우개 2모드·올가미 선택/이동/크기조절 지원.
class DrawingCanvas extends StatefulWidget {
  const DrawingCanvas({
    super.key,
    required this.controller,
    this.allowFingerDrawing = false,
  });

  final DrawingController controller;

  /// 손가락 입력 허용(에뮬레이터·개발용). 끄면 스타일러스만 받는다.
  final bool allowFingerDrawing;

  @override
  State<DrawingCanvas> createState() => _DrawingCanvasState();
}

enum _Gesture { none, draw, erase, lasso, move, resize }

class _DrawingCanvasState extends State<DrawingCanvas> {
  final List<StrokePoint> _current = [];
  final List<Offset> _lasso = [];
  _Gesture _gesture = _Gesture.none;
  int? _activePointer;
  Offset? _eraserAt;
  bool _erasedSomething = false;

  // 이동/크기조절 시작 시점 상태.
  List<Stroke>? _base;
  Rect? _baseBounds;
  Offset _origin = Offset.zero;
  int _handle = -1;

  DrawingController get _c => widget.controller;
  DrawTool get _tool => _c.tool;

  bool _accepts(PointerEvent e) {
    if (e.kind == PointerDeviceKind.stylus) return true;
    // 팜 리젝션: 손가락은 옵션이 켜졌을 때만.
    return widget.allowFingerDrawing &&
        (e.kind == PointerDeviceKind.touch || e.kind == PointerDeviceKind.mouse);
  }

  double _pressure(PointerEvent e) {
    final range = e.pressureMax - e.pressureMin;
    if (range <= 0) return 1;
    return ((e.pressure - e.pressureMin) / range).clamp(0.0, 1.0);
  }

  // ── 포인터 라우팅 ─────────────────────────────────

  void _onDown(PointerDownEvent e) {
    if (!_accepts(e)) return;
    if (_activePointer != null) {
      // 두 번째 손가락 → 진행 중인 제스처를 버리고 줌에 양보.
      _cancelGesture();
      return;
    }
    _activePointer = e.pointer;
    final pos = e.localPosition;
    switch (_tool.kind) {
      case PenKind.eraser:
        _gesture = _Gesture.erase;
        _erasedSomething = false;
        _erase(pos);
      case PenKind.lasso:
        _lassoDown(pos);
      default:
        _gesture = _Gesture.draw;
        _current.add(StrokePoint(pos, _pressure(e)));
    }
    setState(() {});
  }

  void _onMove(PointerMoveEvent e) {
    if (e.pointer != _activePointer) return;
    final pos = e.localPosition;
    switch (_gesture) {
      case _Gesture.draw:
        _current.add(StrokePoint(pos, _pressure(e)));
      case _Gesture.erase:
        _erase(pos);
      case _Gesture.lasso:
        _lasso.add(pos);
      case _Gesture.move:
        _applyMove(pos);
      case _Gesture.resize:
        _applyResize(pos);
      case _Gesture.none:
        return;
    }
    setState(() {});
  }

  void _onEnd(PointerEvent e) {
    if (e.pointer != _activePointer) return;
    _activePointer = null;
    switch (_gesture) {
      case _Gesture.draw:
        _finishStroke();
      case _Gesture.erase:
        _eraserAt = null;
        _erasedSomething = false;
      case _Gesture.lasso:
        _c.setSelection(strokesInside(_c.strokes, _lasso));
        _lasso.clear();
      case _Gesture.move || _Gesture.resize:
        if (_base != null) _c.commitFrom(_base!);
        _base = null;
      case _Gesture.none:
        break;
    }
    _gesture = _Gesture.none;
    setState(() {});
  }

  void _cancelGesture() {
    if (_gesture == _Gesture.move || _gesture == _Gesture.resize) {
      if (_base != null) _c.setStrokes(_base!); // 원위치, undo 안 쌓음
    }
    _current.clear();
    _lasso.clear();
    _base = null;
    _eraserAt = null;
    _gesture = _Gesture.none;
    _activePointer = null;
    setState(() {});
  }

  // ── 그리기 ────────────────────────────────────────

  void _finishStroke() {
    final points = List.of(_current);
    _current.clear();
    if (points.length < 2) return;

    var stroke = Stroke(
      kind: _tool.kind,
      color: _tool.color,
      width: _tool.width,
      points: points,
    );

    // 도형·화살표 자동 인식은 항상 켜져 있다.
    final snapped = ShapeSnap.snap([for (final p in points) p.offset]);
    if (snapped != null) {
      stroke = stroke.copyWith(
        points: [for (final o in snapped.outline) StrokePoint(o, 1)],
      );
    }

    _c.pushSnapshot();
    _c.setStrokes([..._c.strokes, stroke]);
  }

  // ── 지우개 ────────────────────────────────────────

  void _erase(Offset at) {
    _eraserAt = at;
    final result =
        eraseAt(_c.strokes, at, _tool.eraserWidth / 2, _tool.eraserMode);
    if (result.changed) {
      if (!_erasedSomething) {
        _erasedSomething = true;
        _c.pushSnapshot();
      }
      _c.clearSelection();
      _c.setStrokes(result.strokes);
    }
  }

  // ── 올가미: 선택/이동/크기조절 ─────────────────────

  void _lassoDown(Offset pos) {
    final bounds = _selectionBounds();
    if (bounds != null) {
      final h = _hitHandle(bounds, pos);
      if (h >= 0) {
        _gesture = _Gesture.resize;
        _handle = h;
        _startTransform(bounds, pos);
        return;
      }
      if (bounds.contains(pos)) {
        _gesture = _Gesture.move;
        _startTransform(bounds, pos);
        return;
      }
    }
    _gesture = _Gesture.lasso;
    _c.clearSelection();
    _lasso
      ..clear()
      ..add(pos);
  }

  void _startTransform(Rect bounds, Offset pos) {
    _base = List.of(_c.strokes);
    _baseBounds = bounds;
    _origin = pos;
  }

  void _applyMove(Offset pos) {
    final d = pos - _origin;
    _c.setStrokes([
      for (var i = 0; i < _base!.length; i++)
        _c.selection.contains(i)
            ? _base![i].copyWith(points: [
                for (final p in _base![i].points)
                  StrokePoint(p.offset + d, p.pressure),
              ])
            : _base![i],
    ]);
  }

  void _applyResize(Offset pos) {
    final corners = _cornersOf(_baseBounds!);
    final moving = corners[_handle];
    final fixed = corners[(_handle + 2) % 4]; // 반대편 꼭짓점 고정
    final dx = moving.dx - fixed.dx, dy = moving.dy - fixed.dy;
    final sx = dx == 0 ? 1.0 : ((pos.dx - fixed.dx) / dx).clamp(0.05, 20.0);
    final sy = dy == 0 ? 1.0 : ((pos.dy - fixed.dy) / dy).clamp(0.05, 20.0);
    _c.setStrokes([
      for (var i = 0; i < _base!.length; i++)
        _c.selection.contains(i)
            ? _base![i].copyWith(points: [
                for (final p in _base![i].points)
                  StrokePoint(
                    Offset(fixed.dx + (p.offset.dx - fixed.dx) * sx,
                        fixed.dy + (p.offset.dy - fixed.dy) * sy),
                    p.pressure,
                  ),
              ])
            : _base![i],
    ]);
  }

  Rect? _selectionBounds() {
    if (_c.selection.isEmpty) return null;
    var minX = double.infinity, minY = double.infinity;
    var maxX = -double.infinity, maxY = -double.infinity;
    for (final i in _c.selection) {
      if (i >= _c.strokes.length) continue;
      for (final p in _c.strokes[i].points) {
        minX = min(minX, p.offset.dx);
        minY = min(minY, p.offset.dy);
        maxX = max(maxX, p.offset.dx);
        maxY = max(maxY, p.offset.dy);
      }
    }
    if (minX == double.infinity) return null;
    return Rect.fromLTRB(minX, minY, maxX, maxY).inflate(14);
  }

  List<Offset> _cornersOf(Rect r) =>
      [r.topLeft, r.topRight, r.bottomRight, r.bottomLeft];

  int _hitHandle(Rect bounds, Offset pos) {
    final corners = _cornersOf(bounds);
    for (var i = 0; i < 4; i++) {
      if ((pos - corners[i]).distance <= 18) return i;
    }
    return -1;
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: _onDown,
      onPointerMove: _onMove,
      onPointerUp: _onEnd,
      onPointerCancel: _onEnd,
      behavior: HitTestBehavior.opaque,
      child: AnimatedBuilder(
        animation: _c,
        builder: (context, _) => CustomPaint(
          painter: _StrokePainter(
            strokes: _c.strokes,
            current: _current,
            tool: _tool,
            eraserAt: _eraserAt,
            lasso: _tool.kind == PenKind.lasso ? _lasso : const [],
            selectionBounds:
                _tool.kind == PenKind.lasso ? _selectionBounds() : null,
          ),
          size: Size.infinite,
        ),
      ),
    );
  }
}

class _StrokePainter extends CustomPainter {
  _StrokePainter({
    required this.strokes,
    required this.current,
    required this.tool,
    required this.eraserAt,
    required this.lasso,
    required this.selectionBounds,
  });

  final List<Stroke> strokes;
  final List<StrokePoint> current;
  final DrawTool tool;
  final Offset? eraserAt;
  final List<Offset> lasso;
  final Rect? selectionBounds;

  static const _accent = Color(0xFF2F6BFF);

  @override
  void paint(Canvas canvas, Size size) {
    paintStrokes(canvas, strokes);
    if (current.isNotEmpty) {
      paintStroke(canvas, tool.kind, tool.color, tool.width, current);
    }
    if (eraserAt != null) {
      // 지우개 위치 표시.
      canvas.drawCircle(
        eraserAt!,
        tool.eraserWidth / 2,
        Paint()
          ..style = PaintingStyle.stroke
          ..color = const Color(0x88888888),
      );
    }
    if (lasso.length >= 2) {
      final path = Path()..moveTo(lasso.first.dx, lasso.first.dy);
      for (final p in lasso.skip(1)) {
        path.lineTo(p.dx, p.dy);
      }
      _dashPath(
        canvas,
        path,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.5
          ..color = _accent,
      );
    }
    if (selectionBounds != null) {
      final r = selectionBounds!;
      _dashPath(
        canvas,
        Path()..addRect(r),
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.5
          ..color = _accent,
      );
      // 모서리 크기조절 핸들.
      final fill = Paint()..color = const Color(0xFFFFFFFF);
      final border = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5
        ..color = _accent;
      for (final c in [r.topLeft, r.topRight, r.bottomRight, r.bottomLeft]) {
        canvas.drawCircle(c, 6, fill);
        canvas.drawCircle(c, 6, border);
      }
    }
  }

  void _dashPath(Canvas canvas, Path path, Paint paint) {
    for (final metric in path.computeMetrics()) {
      var d = 0.0;
      while (d < metric.length) {
        canvas.drawPath(metric.extractPath(d, min(d + 6, metric.length)), paint);
        d += 11;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _StrokePainter old) => true;
}
