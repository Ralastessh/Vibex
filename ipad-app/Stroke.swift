import UIKit

// 툴바에서 고르는 도구.
enum PenKind {
    case pen, marker, eraser, lasso
}

// 지우개 방식: 획 일부만(픽셀) vs 획 통째로(오브젝트).
enum EraserMode {
    case pixel   // 닿은 부분만 지움 → 획이 쪼개짐
    case object  // 닿은 획 전체를 지움
}

// 현재 선택된 도구.
struct DrawTool: Equatable {
    static let palette: [UIColor] = [
        UIColor(hex: "#111111"),
        UIColor(hex: "#2f6bff"),
        UIColor(hex: "#e0564a"),
        UIColor(hex: "#1f9d55"),
        UIColor(hex: "#f59e0b"),
        UIColor(hex: "#8b5cf6"),
    ]

    var kind: PenKind = .pen
    var color: UIColor = DrawTool.palette[0]
    var width: CGFloat = 5
    var eraserWidth: CGFloat = 24
    var eraserMode: EraserMode = .pixel

    var usesColor: Bool { kind == .pen || kind == .marker }
}

// 획의 한 점. 필압은 0~1.
struct StrokePoint {
    let location: CGPoint
    let pressure: CGFloat
}

struct Stroke {
    let kind: PenKind
    var color: UIColor
    let width: CGFloat
    var points: [StrokePoint]
}

extension UIColor {
    convenience init(hex: String) {
        let s = hex.hasPrefix("#") ? String(hex.dropFirst()) : hex
        var value: UInt64 = 0
        Scanner(string: s).scanHexInt64(&value)
        self.init(
            red: CGFloat((value >> 16) & 0xff) / 255,
            green: CGFloat((value >> 8) & 0xff) / 255,
            blue: CGFloat(value & 0xff) / 255,
            alpha: 1
        )
    }
}
