import 'package:flutter/material.dart';

import 'canvas/drawing_canvas.dart';
import 'canvas/drawing_controller.dart';
import 'widgets/drawing_toolbar.dart';

void main() => runApp(const VibexApp());

class VibexApp extends StatelessWidget {
  const VibexApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Vibex',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.blue),
      home: const DrawingScreen(),
    );
  }
}

/// P1: 캔버스 개발용 화면. 이후 웹뷰 라이브 프리뷰 위에 얹는다.
class DrawingScreen extends StatefulWidget {
  const DrawingScreen({super.key});

  @override
  State<DrawingScreen> createState() => _DrawingScreenState();
}

class _DrawingScreenState extends State<DrawingScreen> {
  final _controller = DrawingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Stack(
          children: [
            Positioned.fill(
              // 두 손가락 핀치로 줌/팬. 한 손가락(펜)은 캔버스가 가져간다.
              child: InteractiveViewer(
                maxScale: 6,
                panEnabled: false,
                child: DrawingCanvas(
                  controller: _controller,
                  allowFingerDrawing: true, // 개발용. 실기기에선 false로.
                ),
              ),
            ),
            Positioned(
              top: 12,
              left: 0,
              right: 0,
              child: Column(
                children: [
                  _topBar(),
                  const SizedBox(height: 8),
                  DrawingToolbar(controller: _controller),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _topBar() {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) => Material(
        color: Colors.white.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(14),
        elevation: 3,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.undo),
                onPressed: _controller.canUndo ? _controller.undo : null,
              ),
              IconButton(
                icon: const Icon(Icons.redo),
                onPressed: _controller.canRedo ? _controller.redo : null,
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline),
                tooltip: '모두 지우기',
                onPressed: _controller.strokes.isEmpty ? null : _controller.clear,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
