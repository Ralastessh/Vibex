package com.hansangcharim.vibex

import android.graphics.Bitmap
import android.graphics.Rect
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.PixelCopy
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.ByteArrayOutputStream

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        // 웹뷰(플랫폼 뷰) 포함 화면 영역을 JPEG로 캡처한다.
        // Flutter의 RepaintBoundary는 플랫폼 뷰를 못 찍기 때문에 창 픽셀을 직접 복사한다.
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "vibex/snapshot")
            .setMethodCallHandler { call, result ->
                if (call.method != "capture") {
                    result.notImplemented()
                    return@setMethodCallHandler
                }
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
                    result.error("unsupported", "Android 8.0 이상이 필요합니다", null)
                    return@setMethodCallHandler
                }
                val src = Rect(
                    call.argument<Int>("left") ?: 0,
                    call.argument<Int>("top") ?: 0,
                    call.argument<Int>("right") ?: 0,
                    call.argument<Int>("bottom") ?: 0,
                )
                val width = call.argument<Int>("width") ?: src.width()
                val height = call.argument<Int>("height") ?: src.height()
                if (src.isEmpty || width <= 0 || height <= 0) {
                    result.error("bad_args", "캡처 영역이 비어 있습니다", null)
                    return@setMethodCallHandler
                }
                val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                PixelCopy.request(window, src, bitmap, { copyResult ->
                    if (copyResult == PixelCopy.SUCCESS) {
                        val out = ByteArrayOutputStream()
                        bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
                        result.success(out.toByteArray())
                    } else {
                        result.error("copy_failed", "화면 캡처에 실패했습니다($copyResult)", null)
                    }
                    bitmap.recycle()
                }, Handler(Looper.getMainLooper()))
            }
    }
}
