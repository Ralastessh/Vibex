import Combine
import UIKit

/// 캔버스 상태(획 목록·도구·선택·undo/redo)를 들고 있는 컨트롤러.
final class DrawingController: ObservableObject {
    @Published var tool = DrawTool()
    @Published private(set) var strokes: [Stroke] = []
    @Published private(set) var selection: Set<Int> = []

    @Published private var undoStack: [[Stroke]] = []
    @Published private var redoStack: [[Stroke]] = []

    var canUndo: Bool { !undoStack.isEmpty }
    var canRedo: Bool { !redoStack.isEmpty }

    /// 변경 직전에 호출해 현재 상태를 undo 스택에 쌓는다.
    func pushSnapshot() {
        undoStack.append(strokes)
        redoStack.removeAll()
    }

    /// 이미 반영된 변경에 대해 시작 시점(base)을 undo 스택에 쌓는다(이동/크기조절).
    func commitFrom(_ base: [Stroke]) {
        undoStack.append(base)
        redoStack.removeAll()
    }

    func setStrokes(_ next: [Stroke]) {
        strokes = next
    }

    // MARK: - 선택

    func setSelection(_ next: Set<Int>) {
        selection = next
    }

    func clearSelection() {
        guard !selection.isEmpty else { return }
        selection = []
    }

    func deleteSelected() {
        guard !selection.isEmpty else { return }
        pushSnapshot()
        strokes = strokes.enumerated()
            .filter { !selection.contains($0.offset) }
            .map(\.element)
        selection = []
    }

    func recolorSelected(_ color: UIColor) {
        guard !selection.isEmpty else { return }
        pushSnapshot()
        for i in selection where strokes.indices.contains(i) {
            strokes[i].color = color
        }
    }

    // MARK: - undo / redo

    func undo() {
        guard let previous = undoStack.popLast() else { return }
        redoStack.append(strokes)
        strokes = previous
        selection = [] // 인덱스가 어긋날 수 있어 선택 해제
    }

    func redo() {
        guard let next = redoStack.popLast() else { return }
        undoStack.append(strokes)
        strokes = next
        selection = []
    }

    func clear() {
        guard !strokes.isEmpty else { return }
        pushSnapshot()
        strokes = []
        selection = []
    }
}
