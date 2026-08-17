import 'dart:ui';

import 'package:flutter/foundation.dart';

import 'stroke.dart';

/// 캔버스 상태(획 목록·도구·선택·undo/redo)를 들고 있는 컨트롤러.
class DrawingController extends ChangeNotifier {
  final DrawTool tool = DrawTool();

  List<Stroke> _strokes = [];
  final Set<int> _selection = {};
  final List<List<Stroke>> _undoStack = [];
  final List<List<Stroke>> _redoStack = [];

  List<Stroke> get strokes => _strokes;
  Set<int> get selection => _selection;
  bool get canUndo => _undoStack.isNotEmpty;
  bool get canRedo => _redoStack.isNotEmpty;

  /// 변경 직전에 호출해 현재 상태를 undo 스택에 쌓는다.
  void pushSnapshot() {
    _undoStack.add(List.of(_strokes));
    _redoStack.clear();
  }

  /// 이미 반영된 변경에 대해 시작 시점(base)을 undo 스택에 쌓는다(이동/크기조절).
  void commitFrom(List<Stroke> base) {
    _undoStack.add(base);
    _redoStack.clear();
    notifyListeners();
  }

  void setStrokes(List<Stroke> next) {
    _strokes = next;
    notifyListeners();
  }

  // ── 선택 ──────────────────────────────────────────

  void setSelection(Set<int> next) {
    _selection
      ..clear()
      ..addAll(next);
    notifyListeners();
  }

  void clearSelection() {
    if (_selection.isEmpty) return;
    _selection.clear();
    notifyListeners();
  }

  void deleteSelected() {
    if (_selection.isEmpty) return;
    pushSnapshot();
    _strokes = [
      for (var i = 0; i < _strokes.length; i++)
        if (!_selection.contains(i)) _strokes[i],
    ];
    _selection.clear();
    notifyListeners();
  }

  void recolorSelected(Color color) {
    if (_selection.isEmpty) return;
    pushSnapshot();
    _strokes = [
      for (var i = 0; i < _strokes.length; i++)
        _selection.contains(i)
            ? _strokes[i].copyWith(color: color)
            : _strokes[i],
    ];
    notifyListeners();
  }

  // ── undo / redo ───────────────────────────────────

  void undo() {
    if (_undoStack.isEmpty) return;
    _redoStack.add(_strokes);
    _strokes = _undoStack.removeLast();
    _selection.clear(); // 인덱스가 어긋날 수 있어 선택 해제
    notifyListeners();
  }

  void redo() {
    if (_redoStack.isEmpty) return;
    _undoStack.add(_strokes);
    _strokes = _redoStack.removeLast();
    _selection.clear();
    notifyListeners();
  }

  void clear() {
    if (_strokes.isEmpty) return;
    pushSnapshot();
    _strokes = [];
    _selection.clear();
    notifyListeners();
  }

  /// 도구 상태 변경 알림용(툴바에서 사용).
  void toolChanged() => notifyListeners();
}
