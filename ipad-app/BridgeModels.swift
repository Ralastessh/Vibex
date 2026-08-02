import Foundation

// 백엔드 응답 모델. 키가 camelCase라 프로퍼티 이름만 맞추면 그냥 디코딩된다.

// MARK: - 프로젝트

enum ProjectStatus: String, Codable {
    case idle, busy, unavailable
}

struct Project: Codable, Identifiable, Hashable {
    let projectId: String
    let displayName: String
    let status: ProjectStatus
    var activeTaskId: String?
    var reason: String?

    var id: String { projectId }
}

struct ProjectListResponse: Codable {
    let projects: [Project]
}

// MARK: - 작업(Task)

enum TaskStatus: String, Codable {
    case queued, interpreting
    case awaitingConfirmation = "awaiting_confirmation"
    case resolvingSession = "resolving_session"
    case runningAgent = "running_agent"
    case testing, completed, failed, cancelled

    /// 아직 진행 중인가(폴링을 계속할지 판단).
    var isActive: Bool {
        switch self {
        case .completed, .failed, .cancelled: return false
        default: return true
        }
    }
}

struct ChangedFile: Codable, Hashable {
    let path: String
    var summary: String = ""
}

struct TestResult: Codable, Hashable {
    let command: String
    let status: String // passed / failed / skipped
    var summary: String = ""
}

struct QuestionOption: Codable, Hashable {
    let optionId: String
    let label: String
}

struct Question: Codable, Hashable, Identifiable {
    let questionId: String
    let text: String
    var options: [QuestionOption] = []
    var id: String { questionId }
}

// Vision 해석 결과(승인 화면에서 보여줌). 필드는 옵셔널로 둬 디코딩이 안 깨지게.
struct ProjectCommand: Codable, Hashable {
    var schemaVersion: String?
    var taskType: String?
    var summary: String?
    var target: Target?
    var changes: [Change]?
    var constraints: [String]?
    var questions: [String]?
    var overallConfidence: Double?

    struct Target: Codable, Hashable { var screen: String? }
    struct Detail: Codable, Hashable { let name: String; let value: String }
    struct Change: Codable, Hashable {
        let operation: String
        let target: String
        var description: String = ""
        var details: [Detail] = []
        var confidence: Double = 0
    }
}

/// 백엔드의 Task. Swift 동시성 `Task`와 충돌하지 않도록 `AgentTask`로 둔다.
struct AgentTask: Codable, Identifiable, Hashable {
    let taskId: String
    let projectId: String
    let status: TaskStatus
    var createdAt: String?
    var updatedAt: String?
    var clientTaskId: String?
    var sessionId: String?
    var interpretation: ProjectCommand?
    var summary: String?
    var changedFiles: [ChangedFile] = []
    var testResults: [TestResult] = []
    var questions: [Question] = []
    var warnings: [String] = []
    var error: String?

    var id: String { taskId }

    /// 해석 결과 승인을 기다리는 상태인가(질문이 아니라 interpretation 확인).
    var needsConfirmation: Bool {
        status == .awaitingConfirmation && interpretation != nil && questions.isEmpty
    }

    /// 탭으로 답할 질문이 떠 있는가.
    var needsAnswer: Bool {
        status == .awaitingConfirmation && !questions.isEmpty
    }
}

struct TaskListResponse: Codable {
    let tasks: [AgentTask]
}

/// POST /tasks, /confirm, /answer 등이 돌려주는 가벼운 응답.
struct TaskCreated: Codable {
    let taskId: String
    let status: TaskStatus
}
