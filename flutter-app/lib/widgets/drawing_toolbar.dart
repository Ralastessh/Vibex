import 'package:flutter/material.dart';

import '../canvas/drawing_controller.dart';
import '../canvas/stroke.dart';

/// 항상 보이는 필기 툴바 — 펜/형광펜/지우개/올가미 + 색·두께.
class DrawingToolbar extends StatelessWidget {
  const DrawingToolbar({super.key, required this.controller});

  final DrawingController controller;

  static const _widths = [2.0, 5.0, 9.0];
  static const _eraserWidths = [12.0, 24.0, 40.0];

  DrawTool get _tool => controller.tool;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) => Material(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(14),
        elevation: 3,
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _toolButton(PenKind.pen, Icons.edit),
              _toolButton(PenKind.marker, Icons.brush),
              _toolButton(PenKind.eraser, Icons.cleaning_services_outlined),
              _toolButton(PenKind.lasso, Icons.highlight_alt),
              if (_tool.usesColor) ...[
                _divider(),
                for (final c in DrawTool.palette) _colorDot(c),
                _divider(),
                for (final w in _widths)
                  _widthDot(
                    dot: w + 4,
                    selected: _tool.width == w,
                    onTap: () {
                      _tool.width = w;
                      controller.toolChanged();
                    },
                  ),
              ] else if (_tool.kind == PenKind.eraser) ...[
                _divider(),
                _eraserModeButton(EraserMode.pixel, '일부'),
                _eraserModeButton(EraserMode.object, '전체'),
                _divider(),
                for (final w in _eraserWidths)
                  _widthDot(
                    // 지우개 실굵기는 최대 40이라 점 크기는 눌러 표시.
                    dot: w / 2 + 4,
                    selected: _tool.eraserWidth == w,
                    onTap: () {
                      _tool.eraserWidth = w;
                      controller.toolChanged();
                    },
                  ),
              ] else if (_tool.kind == PenKind.lasso &&
                  controller.selection.isNotEmpty) ...[
                // 선택된 획 색 변경 + 삭제.
                _divider(),
                for (final c in DrawTool.palette) _colorDot(c),
                _divider(),
                InkWell(
                  borderRadius: BorderRadius.circular(8),
                  onTap: controller.deleteSelected,
                  child: const SizedBox(
                    width: 40,
                    height: 34,
                    child: Icon(Icons.delete_outline, size: 19),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _divider() => Container(
        width: 1,
        height: 26,
        margin: const EdgeInsets.symmetric(horizontal: 8),
        color: const Color(0x33888888),
      );

  Widget _toolButton(PenKind kind, IconData icon) {
    final selected = _tool.kind == kind;
    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: () {
        _tool.kind = kind;
        controller.clearSelection();
        controller.toolChanged();
      },
      child: Container(
        width: 40,
        height: 34,
        decoration: BoxDecoration(
          color: selected ? const Color(0x332F6BFF) : null,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 19),
      ),
    );
  }

  Widget _colorDot(Color color) {
    final selected = _tool.color == color;
    return GestureDetector(
      onTap: () {
        // 올가미 선택 중이면 선택 획의 색을 바꾼다.
        if (_tool.kind == PenKind.lasso) {
          controller.recolorSelected(color);
          return;
        }
        _tool.color = color;
        controller.toolChanged();
      },
      child: Container(
        width: 22,
        height: 22,
        margin: const EdgeInsets.symmetric(horizontal: 3),
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: selected ? Border.all(width: 2, color: Colors.black87) : null,
        ),
      ),
    );
  }

  Widget _widthDot({
    required double dot,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 30,
        height: 30,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? const Color(0x1F000000) : null,
          shape: BoxShape.circle,
        ),
        child: Container(
          width: dot,
          height: dot,
          decoration: const BoxDecoration(
            color: Colors.black87,
            shape: BoxShape.circle,
          ),
        ),
      ),
    );
  }

  Widget _eraserModeButton(EraserMode mode, String label) {
    final selected = _tool.eraserMode == mode;
    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: () {
        _tool.eraserMode = mode;
        controller.toolChanged();
      },
      child: Container(
        width: 40,
        height: 30,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? const Color(0x332F6BFF) : null,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(label,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
      ),
    );
  }
}
