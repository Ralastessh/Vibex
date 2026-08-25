import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import 'models.dart';

/// 서버가 주는 안내 문구를 그대로 살린다.
class BridgeException implements Exception {
  const BridgeException(this.message, [this.statusCode]);
  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

/// PC의 Desktop Bridge와 통신한다.
class BridgeClient {
  BridgeClient(String baseUrl) : root = _normalizeRoot(baseUrl);

  /// `/api/v1/...`가 섞여 들어와도 서버 루트로 되돌린다.
  static Uri _normalizeRoot(String input) {
    var uri = Uri.parse(input.trim());
    if (!uri.hasScheme) uri = Uri.parse('http://${input.trim()}');
    final segments = List.of(uri.pathSegments);
    final apiIndex = segments.indexWhere((s) => s.toLowerCase() == 'api');
    if (apiIndex >= 0 &&
        apiIndex + 1 < segments.length &&
        segments[apiIndex + 1].toLowerCase() == 'v1') {
      segments.removeRange(apiIndex, segments.length);
    }
    return uri.replace(pathSegments: segments, query: null, fragment: null);
  }

  final Uri root;
  final http.Client _http = http.Client();

  Uri _uri(String path, [Map<String, String>? query]) => root.replace(
        pathSegments: [
          ...root.pathSegments.where((s) => s.isNotEmpty),
          'api',
          'v1',
          ...path.split('/'),
        ],
        queryParameters: query,
      );

  // ── 프로젝트 ──────────────────────────────────────

  Future<int> health() async {
    final json = await _get('health');
    return json['projects'] as int? ?? 0;
  }

  Future<List<ProjectView>> listProjects() async {
    final json = await _get('projects');
    return [
      for (final p in json['projects'] as List)
        ProjectView.fromJson(p as Map<String, dynamic>),
    ];
  }

  Future<PreviewView> startPreview(String projectId) async {
    final json = await _post('projects/$projectId/preview');
    return PreviewView.fromJson(json);
  }

  // ── 작업 ──────────────────────────────────────────

  /// 그림을 보낸다. canvasPng는 획만 있는 투명 PNG.
  /// renderedJpeg(라이브 렌더 캡처)는 아직 없으면 생략 가능.
  Future<TaskCreated> createTask({
    required String projectId,
    required Uint8List canvasPng,
    required String clientTaskId,
    Uint8List? renderedJpeg,
    String? typedNote,
    String? conversationId,
    String? agentId,
  }) async {
    final req = http.MultipartRequest('POST', _uri('tasks'))
      ..fields['projectId'] = projectId
      ..fields['clientTaskId'] = clientTaskId;
    if (conversationId != null) req.fields['conversationId'] = conversationId;
    if (agentId != null) req.fields['agentId'] = agentId;
    if (typedNote != null && typedNote.trim().isNotEmpty) {
      req.fields['typedNote'] = typedNote;
    }
    req.files.add(http.MultipartFile.fromBytes(
      'canvasImage',
      canvasPng,
      filename: 'canvas.png',
      contentType: MediaType('image', 'png'),
    ));
    if (renderedJpeg != null) {
      req.files.add(http.MultipartFile.fromBytes(
        'renderedViewImage',
        renderedJpeg,
        filename: 'base.jpg',
        contentType: MediaType('image', 'jpeg'),
      ));
    }
    return TaskCreated.fromJson(await _send(req));
  }

  Future<TaskView> task(String taskId) async =>
      TaskView.fromJson(await _get('tasks/$taskId'));

  /// 되물음에 추천 선택지 또는 직접 입력으로 답한다.
  Future<TaskCreated> answer(
    String taskId, {
    required String questionId,
    String? optionId,
    String? freeText,
  }) async {
    final body = <String, dynamic>{'questionId': questionId};
    if (optionId != null) body['selectedOptionId'] = optionId;
    if (freeText != null && freeText.trim().isNotEmpty) {
      body['freeText'] = freeText;
      // 이전 백엔드 호환: 직접 입력임을 나타내는 예약값.
      if (optionId == null) body['selectedOptionId'] = '__free_text__';
    }
    return TaskCreated.fromJson(await _postJson('tasks/$taskId/answer', body));
  }

  Future<TaskView> cancel(String taskId) async =>
      TaskView.fromJson(await _post('tasks/$taskId/cancel'));

  // ── 내부 ──────────────────────────────────────────

  Future<Map<String, dynamic>> _get(String path) async {
    try {
      return _decode(await _http.get(_uri(path)));
    } on SocketException {
      throw const BridgeException('PC에 연결할 수 없습니다. 브리지 서버가 켜져 있는지 확인해 주세요.');
    }
  }

  Future<Map<String, dynamic>> _post(String path) async {
    try {
      return _decode(await _http.post(_uri(path)));
    } on SocketException {
      throw const BridgeException('PC에 연결할 수 없습니다. 브리지 서버가 켜져 있는지 확인해 주세요.');
    }
  }

  Future<Map<String, dynamic>> _postJson(
      String path, Map<String, dynamic> body) async {
    try {
      return _decode(await _http.post(
        _uri(path),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      ));
    } on SocketException {
      throw const BridgeException('PC에 연결할 수 없습니다. 브리지 서버가 켜져 있는지 확인해 주세요.');
    }
  }

  Future<Map<String, dynamic>> _send(http.MultipartRequest req) async {
    try {
      final streamed = await _http.send(req);
      return _decode(await http.Response.fromStream(streamed));
    } on SocketException {
      throw const BridgeException('PC에 연결할 수 없습니다. 브리지 서버가 켜져 있는지 확인해 주세요.');
    }
  }

  Map<String, dynamic> _decode(http.Response res) {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw BridgeException(_message(res), res.statusCode);
    }
    try {
      return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    } catch (_) {
      throw BridgeException('서버 응답을 해석할 수 없습니다.', res.statusCode);
    }
  }

  /// 서버가 내려준 detail을 우선 쓰고, 없을 때만 상태 코드로 문구를 만든다.
  String _message(http.Response res) {
    try {
      final detail = (jsonDecode(utf8.decode(res.bodyBytes))
          as Map<String, dynamic>)['detail'] as String?;
      if (detail != null && detail.isNotEmpty) return detail;
    } catch (_) {}
    return switch (res.statusCode) {
      401 => 'Tailscale 연결과 로그인 계정을 확인해 주세요.',
      404 => '요청한 항목을 PC에서 찾을 수 없습니다.',
      409 => '지금은 처리할 수 없는 상태입니다.',
      413 => '보낸 이미지가 너무 큽니다.',
      415 => '지원하지 않는 이미지 형식입니다.',
      503 => 'PC에서 아직 준비되지 않은 기능입니다.',
      _ => '요청이 실패했습니다(${res.statusCode}).',
    };
  }
}
