import 'package:flutter/services.dart';

/// 네이티브 창 픽셀 캡처(웹뷰 포함). MainActivity의 vibex/snapshot 채널 사용.
const _channel = MethodChannel('vibex/snapshot');

/// physicalRect(물리 픽셀 좌표) 영역을 target 크기 JPEG로 캡처한다.
Future<Uint8List?> captureWindowRegion({
  required Rect physicalRect,
  required int targetWidth,
  required int targetHeight,
}) async {
  try {
    return await _channel.invokeMethod<Uint8List>('capture', {
      'left': physicalRect.left.round(),
      'top': physicalRect.top.round(),
      'right': physicalRect.right.round(),
      'bottom': physicalRect.bottom.round(),
      'width': targetWidth,
      'height': targetHeight,
    });
  } on PlatformException {
    return null; // 미지원 플랫폼(iOS 미구현 등) → 렌더 없이 전송 시도
  } on MissingPluginException {
    return null;
  }
}
