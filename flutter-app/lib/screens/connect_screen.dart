import 'package:flutter/material.dart';

import '../api/bridge_client.dart';
import '../api/models.dart';
import 'editor_screen.dart';

/// 서버 주소 입력 → 프로젝트 선택 → 라이브 프리뷰 에디터로 진입.
class ConnectScreen extends StatefulWidget {
  const ConnectScreen({super.key});

  @override
  State<ConnectScreen> createState() => _ConnectScreenState();
}

class _ConnectScreenState extends State<ConnectScreen> {
  // 에뮬레이터에서 호스트 PC는 10.0.2.2. 실기기는 Tailscale/PC IP로 바꾼다.
  final _urlController = TextEditingController(text: 'http://10.0.2.2:8787');
  BridgeClient? _client;
  List<ProjectView> _projects = [];
  bool _busy = false;
  String? _error;

  Future<void> _connect() async {
    setState(() {
      _busy = true;
      _error = null;
      _projects = [];
    });
    try {
      final client = BridgeClient(_urlController.text);
      await client.health();
      final projects = await client.listProjects();
      if (!mounted) return;
      setState(() {
        _client = client;
        _projects = projects;
      });
    } on Exception catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _open(ProjectView project) async {
    final client = _client;
    if (client == null) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final preview = await client.startPreview(project.projectId);
      if (!mounted) return;
      var url = Uri.parse(preview.url);
      // 서버가 localhost 프리뷰 주소를 주면 에뮬레이터 관점 주소로 바꾼다.
      if (url.host == '127.0.0.1' || url.host == 'localhost') {
        url = url.replace(host: client.root.host);
      }
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => EditorScreen(
            client: client,
            project: project,
            previewUrl: url,
          ),
        ),
      );
    } on Exception catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Vibex 연결')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _urlController,
              decoration: const InputDecoration(
                labelText: '브리지 서버 주소',
                hintText: 'http://10.0.2.2:8787',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.url,
              onSubmitted: (_) => _connect(),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: _busy ? null : _connect,
              child: _busy
                  ? const SizedBox(
                      width: 18, height: 18, child: CircularProgressIndicator())
                  : const Text('연결'),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 16),
            Expanded(
              child: ListView(
                children: [
                  for (final p in _projects)
                    Card(
                      child: ListTile(
                        title: Text(p.displayName),
                        subtitle: Text(
                          p.previewAvailable
                              ? p.status
                              : '${p.status} · 프리뷰 없음',
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        enabled: p.previewAvailable && !_busy,
                        onTap: () => _open(p),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
