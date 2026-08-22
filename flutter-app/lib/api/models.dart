/// 서버 응답 모델. 필드 이름은 백엔드 alias(camelCase)를 그대로 따른다.
/// ipad-app/BridgeClient.swift의 모델부 이식.
library;

enum TaskStatus {
  queued,
  interpreting,
  awaitingConfirmation,
  resolvingSession,
  runningAgent,
  testing,
  completed,
  failed,
  cancelled;

  static TaskStatus parse(String raw) => switch (raw) {
        'queued' => queued,
        'interpreting' => interpreting,
        'awaiting_confirmation' => awaitingConfirmation,
        'resolving_session' => resolvingSession,
        'running_agent' => runningAgent,
        'testing' => testing,
        'completed' => completed,
        'failed' => failed,
        'cancelled' => cancelled,
        _ => failed,
      };

  /// 아직 끝나지 않은 상태.
  bool get isActive => switch (this) {
        completed || failed || cancelled => false,
        _ => true,
      };

  String get label => switch (this) {
        queued => '대기 중',
        interpreting => '이미지 준비 중',
        resolvingSession => '세션 찾는 중',
        runningAgent => 'CLI 작업 중',
        awaitingConfirmation => '선택 필요',
        testing => '테스트 중',
        completed => '완료',
        failed => '실패',
        cancelled => '취소',
      };
}

class TaskCreated {
  const TaskCreated({
    required this.taskId,
    required this.status,
    this.conversationId,
  });

  factory TaskCreated.fromJson(Map<String, dynamic> json) => TaskCreated(
        taskId: json['taskId'] as String,
        status: TaskStatus.parse(json['status'] as String),
        conversationId: json['conversationId'] as String?,
      );

  final String taskId;
  final TaskStatus status;
  final String? conversationId;
}

class ProjectView {
  const ProjectView({
    required this.projectId,
    required this.displayName,
    required this.status,
    required this.previewAvailable,
  });

  factory ProjectView.fromJson(Map<String, dynamic> json) => ProjectView(
        projectId: json['projectId'] as String,
        displayName: json['displayName'] as String,
        status: json['status'] as String, // idle | busy | unavailable
        previewAvailable: json['previewAvailable'] as bool? ?? false,
      );

  final String projectId;
  final String displayName;
  final String status;
  final bool previewAvailable;
}

class PreviewView {
  const PreviewView({required this.projectId, required this.url});

  factory PreviewView.fromJson(Map<String, dynamic> json) => PreviewView(
        projectId: json['projectId'] as String,
        url: json['url'] as String,
      );

  final String projectId;
  final String url;
}

class QuestionOption {
  const QuestionOption({required this.optionId, required this.label});

  factory QuestionOption.fromJson(Map<String, dynamic> json) => QuestionOption(
        optionId: json['optionId'] as String,
        label: json['label'] as String,
      );

  final String optionId;
  final String label;
}

class OverlayTarget {
  const OverlayTarget({
    required this.shape,
    required this.x,
    required this.y,
    required this.width,
    required this.height,
    required this.label,
  });

  factory OverlayTarget.fromJson(Map<String, dynamic> json) => OverlayTarget(
        shape: json['shape'] as String? ?? 'rect',
        x: (json['x'] as num).toDouble(),
        y: (json['y'] as num).toDouble(),
        width: (json['width'] as num).toDouble(),
        height: (json['height'] as num).toDouble(),
        label: json['label'] as String? ?? '',
      );

  final String shape;
  final double x, y, width, height;
  final String label;
}

class Question {
  const Question({
    required this.questionId,
    required this.text,
    required this.options,
    this.overlay,
  });

  factory Question.fromJson(Map<String, dynamic> json) => Question(
        questionId: json['questionId'] as String,
        text: json['text'] as String,
        options: [
          for (final o in json['options'] as List? ?? [])
            QuestionOption.fromJson(o as Map<String, dynamic>),
        ],
        overlay: json['overlay'] == null
            ? null
            : OverlayTarget.fromJson(json['overlay'] as Map<String, dynamic>),
      );

  final String questionId;
  final String text;
  final List<QuestionOption> options;
  final OverlayTarget? overlay;
}

class TaskView {
  const TaskView({
    required this.taskId,
    required this.status,
    required this.questions,
    this.conversationId,
    this.summary,
    this.agentReply,
    this.error,
  });

  factory TaskView.fromJson(Map<String, dynamic> json) => TaskView(
        taskId: json['taskId'] as String,
        status: TaskStatus.parse(json['status'] as String),
        conversationId: json['conversationId'] as String?,
        summary: json['summary'] as String?,
        agentReply: json['agentReply'] as String?,
        error: json['error'] as String?,
        questions: [
          for (final q in json['questions'] as List? ?? [])
            Question.fromJson(q as Map<String, dynamic>),
        ],
      );

  final String taskId;
  final TaskStatus status;
  final String? conversationId;
  final String? summary;
  final String? agentReply;
  final String? error;
  final List<Question> questions;
}
