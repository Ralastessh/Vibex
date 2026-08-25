import 'dart:math';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../api/bridge_client.dart';
import '../api/models.dart';
import '../canvas/drawing_canvas.dart';
import '../canvas/drawing_controller.dart';
import '../canvas/stroke_renderer.dart';
import '../util/window_capture.dart';
import '../widgets/drawing_toolbar.dart';

/// PC에서 실행한 프론트엔드를 그대로 조작하고, 같은 화면 좌표계에 주석을 그린다.
class EditorScreen extends StatefulWidget {
  const EditorScreen({
    super.key,
    required this.client,
    required this.project,
    required this.previewUrl,
  });

  final BridgeClient client;
  final ProjectView project;
  final Uri previewUrl;

  @override
  State<EditorScreen> createState() => _EditorScreenState();
}

class _EditorScreenState extends State<EditorScreen> {
  late final WebViewController _web;
  final _canvas = DrawingController();
  final _freeTextController = TextEditingController();
  final _captureKey = GlobalKey();
  final _viewerTransform = TransformationController();

  bool _drawingMode = false;
  bool _capturing = false; // 렌더 캡처 중 — 획·툴바를 한 프레임 숨긴다
  bool _sending = false;
  String _clientTaskId = _newId();
  String? _activeTaskId;
  String? _conversationId; // 첫 작업 후 서버가 준 대화를 이어서 쓴다.
  TaskStatus? _status;
  List<Question> _questions = [];

  static String _newId() {
    final r = Random();
    return List.generate(32, (_) => r.nextInt(16).toRadixString(16)).join();
  }

  @override
  void initState() {
    super.initState();
    _web = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(widget.previewUrl);
  }

  @override
  void dispose() {
    _canvas.dispose();
    _freeTextController.dispose();
    _viewerTransform.dispose();
    super.dispose();
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  // ── 전송 ──────────────────────────────────────────

  /// 웹뷰가 보이는 영역을 획 PNG와 같은 픽셀 크기로 캡처한다.
  /// 획·툴바를 한 프레임 숨기고 줌을 원위치한 뒤 창 픽셀을 복사한다.
  Future<Uint8List?> _captureBase(Size size, double scale) async {
    final savedTransform = _viewerTransform.value.clone();
    final dpr = MediaQuery.of(context).devicePixelRatio;
    setState(() {
      _capturing = true;
      _viewerTransform.value = Matrix4.identity();
    });
    try {
      await WidgetsBinding.instance.endOfFrame;
      // 플랫폼 뷰(웹뷰) 합성이 화면에 반영될 시간을 준다.
      await Future<void>.delayed(const Duration(milliseconds: 80));
      final box =
          _captureKey.currentContext?.findRenderObject() as RenderBox?;
      if (box == null) return null;
      final origin = box.localToGlobal(Offset.zero);
      return await captureWindowRegion(
        physicalRect: Rect.fromLTWH(
          origin.dx * dpr,
          origin.dy * dpr,
          box.size.width * dpr,
          box.size.height * dpr,
        ),
        targetWidth: (size.width * scale).round(),
        targetHeight: (size.height * scale).round(),
      );
    } finally {
      // 캡처 도중 화면을 빠져나갔을 수 있다.
      if (mounted) {
        setState(() {
          _capturing = false;
          _viewerTransform.value = savedTransform;
        });
      }
    }
  }

  Future<void> _send(Size canvasSize) async {
    if (_sending || _activeTaskId != null) return;
    if (_canvas.strokes.isEmpty) {
      _showError('먼저 수정할 부분을 그려 주세요.');
      return;
    }
    setState(() => _sending = true);
    try {
      final dpr = MediaQuery.of(context).devicePixelRatio;
      final longest = max(canvasSize.width, canvasSize.height);
      final scale = max(1.0, min(dpr, kMaxPixelDimension / longest));

      final png = await strokesToPng(
        _canvas.strokes,
        canvasSize,
        displayScale: dpr,
      );
      if (png == null) {
        throw const BridgeException('그림을 전송 이미지로 만들지 못했습니다.');
      }
      final base = await _captureBase(canvasSize, scale);
      final result = await widget.client.createTask(
        projectId: widget.project.projectId,
        canvasPng: png,
        renderedJpeg: base,
        clientTaskId: _clientTaskId,
        conversationId: _conversationId,
      );
      if (!mounted) return;
      setState(() {
        _activeTaskId = result.taskId;
        _conversationId = result.conversationId ?? _conversationId;
        _status = result.status;
        _drawingMode = false;
        _clientTaskId = _newId();
      });
      _canvas.clear();
      await _monitor(result.taskId);
    } on Exception catch (e) {
      _showError(e.toString());
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _monitor(String taskId) async {
    while (mounted) {
      try {
        final task = await widget.client.task(taskId);
        if (!mounted) return;
        setState(() => _status = task.status);
        if (task.status == TaskStatus.awaitingConfirmation &&
            task.questions.isNotEmpty) {
          setState(() => _questions = task.questions);
          return;
        }
        if (!task.status.isActive) {
          setState(() {
            _activeTaskId = null;
            _questions = [];
            _conversationId = task.conversationId ?? _conversationId;
          });
          _showResult(task);
          return;
        }
      } on Exception catch (e) {
        _showError(e.toString());
        return;
      }
      await Future<void>.delayed(const Duration(milliseconds: 1200));
    }
  }

  void _showResult(TaskView task) {
    if (!mounted) return;
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(task.status.label),
        content: SingleChildScrollView(
          child: Text(
            task.agentReply ?? task.summary ?? task.error ?? '작업이 끝났습니다.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('확인'),
          ),
        ],
      ),
    );
  }

  Future<void> _answer(Question question,
      {String? optionId, String? freeText}) async {
    final taskId = _activeTaskId;
    if (taskId == null) return;
    setState(() {
      _questions = [];
      _sending = true;
    });
    try {
      await widget.client.answer(
        taskId,
        questionId: question.questionId,
        optionId: optionId,
        freeText: freeText,
      );
      _freeTextController.clear();
      await _monitor(taskId);
    } on Exception catch (e) {
      if (mounted) setState(() => _questions = [question]);
      _showError(e.toString());
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _cancelTask() async {
    final taskId = _activeTaskId;
    if (taskId == null) return;
    try {
      await widget.client.cancel(taskId);
      if (!mounted) return;
      setState(() {
        _activeTaskId = null;
        _questions = [];
        _status = TaskStatus.cancelled;
      });
    } on Exception catch (e) {
      _showError(e.toString());
    }
  }

  // ── 화면 ──────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final size = Size(constraints.maxWidth, constraints.maxHeight);
            return Stack(
              children: [
                Positioned.fill(
                  // 두 손가락 핀치로 줌/팬 — 펜 모드에서도 동작한다.
                  child: InteractiveViewer(
                    maxScale: 6,
                    panEnabled: false,
                    transformationController: _viewerTransform,
                    child: Stack(
                      key: _captureKey,
                      children: [
                        Positioned.fill(
                          child: IgnorePointer(
                            ignoring: _drawingMode || _questions.isNotEmpty,
                            child: WebViewWidget(controller: _web),
                          ),
                        ),
                        // 그림은 손 모드에서도 계속 보인다. 입력만 막는다.
                        // 렌더 캡처 순간에만 획을 숨긴다.
                        Positioned.fill(
                          child: IgnorePointer(
                            ignoring: !_drawingMode || _questions.isNotEmpty,
                            child: Opacity(
                              opacity: _capturing ? 0 : 1,
                              child: DrawingCanvas(
                                controller: _canvas,
                                allowFingerDrawing: true,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (_questions.isNotEmpty) _questionLayer(size),
                if (!_capturing)
                  Positioned(
                    top: 8,
                    left: 0,
                    right: 0,
                    child: Column(
                      children: [
                        _toolbar(size),
                        if (_drawingMode) ...[
                          const SizedBox(height: 8),
                          DrawingToolbar(controller: _canvas),
                        ],
                      ],
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _toolbar(Size size) {
    return Material(
      color: Colors.white.withValues(alpha: 0.94),
      borderRadius: BorderRadius.circular(14),
      elevation: 3,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SegmentedButton<bool>(
              segments: const [
                ButtonSegment(
                    value: false, icon: Icon(Icons.touch_app, size: 18)),
                ButtonSegment(value: true, icon: Icon(Icons.edit, size: 18)),
              ],
              selected: {_drawingMode},
              onSelectionChanged: (s) =>
                  setState(() => _drawingMode = s.first),
              showSelectedIcon: false,
            ),
            const SizedBox(width: 4),
            if (_drawingMode) ...[
              AnimatedBuilder(
                animation: _canvas,
                builder: (context, _) => Row(children: [
                  IconButton(
                    icon: const Icon(Icons.undo),
                    onPressed: _canvas.canUndo ? _canvas.undo : null,
                  ),
                  IconButton(
                    icon: const Icon(Icons.redo),
                    onPressed: _canvas.canRedo ? _canvas.redo : null,
                  ),
                ]),
              ),
            ] else
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: _web.reload,
              ),
            const SizedBox(width: 8),
            if (_status != null)
              Text(
                _status!.label,
                style: const TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w600),
              ),
            if (_activeTaskId != null)
              IconButton(
                icon: const Icon(Icons.cancel_outlined, color: Colors.red),
                onPressed: _cancelTask,
              ),
            const SizedBox(width: 4),
            FilledButton.icon(
              onPressed:
                  (_sending || _activeTaskId != null || !_drawingMode)
                      ? null
                      : () => _send(size),
              icon: _sending
                  ? const SizedBox(
                      width: 14, height: 14, child: CircularProgressIndicator())
                  : const Icon(Icons.send, size: 16),
              label: const Text('전송'),
            ),
          ],
        ),
      ),
    );
  }

  // ── 되물음 ────────────────────────────────────────

  Widget _questionLayer(Size size) {
    return Positioned.fill(
      child: Container(
        color: Colors.black.withValues(alpha: 0.08),
        child: Stack(
          children: [
            for (final q in _questions) ...[
              if (q.overlay != null) _targetBox(q.overlay!, size),
              _questionCard(q, size),
            ],
          ],
        ),
      ),
    );
  }

  /// LLM이 지정한 영역 표시. 상대좌표(0~1) 기준.
  Widget _targetBox(OverlayTarget t, Size size) {
    final rect = Rect.fromLTWH(
      size.width * t.x,
      size.height * t.y,
      max(44, size.width * t.width),
      max(44, size.height * t.height),
    );
    final border = Border.all(
        color: Theme.of(context).colorScheme.primary, width: 2.5);
    return Positioned.fromRect(
      rect: rect,
      child: Container(
        decoration: t.shape == 'ellipse' || t.shape == 'capsule'
            ? BoxDecoration(
                shape: BoxShape.circle,
                border: border,
              )
            : BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                border: border,
              ),
      ),
    );
  }

  Widget _questionCard(Question q, Size size) {
    final overlay = q.overlay;
    final below = overlay == null
        ? size.height * 0.65
        : min(size.height * (overlay.y + overlay.height) + 24,
            size.height - 180);
    return Positioned(
      left: 16,
      right: 16,
      top: below,
      child: Card(
        elevation: 8,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (overlay != null && overlay.label.isNotEmpty)
                Text(overlay.label,
                    style: Theme.of(context).textTheme.labelSmall),
              Text(q.text, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 10),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    for (final option in q.options) ...[
                      FilledButton(
                        onPressed: () =>
                            _answer(q, optionId: option.optionId),
                        child: Text(option.label),
                      ),
                      const SizedBox(width: 8),
                    ],
                    SizedBox(
                      width: 200,
                      child: TextField(
                        controller: _freeTextController,
                        decoration: const InputDecoration(
                          hintText: '직접 입력',
                          isDense: true,
                          border: OutlineInputBorder(),
                        ),
                        onSubmitted: (text) => _answer(q, freeText: text),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.arrow_upward),
                      onPressed: () =>
                          _answer(q, freeText: _freeTextController.text),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
