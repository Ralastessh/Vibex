from __future__ import annotations
import base64
import json
import logging
from typing import Protocol, runtime_checkable
import httpx
from src.vision.schema import ProjectCommand, json_schema

logger = logging.getLogger("bridge.vision")

ENDPOINT = "https://api.openai.com/v1/chat/completions"
SYSTEM_PROMPT = """너는 사용자의 UI 스케치를 개발 명령으로 옮기는 해석기다.

주어지는 것:
- canvas: 사용자가 펜으로 그린 그림. 화살표는 이동, 동그라미는 강조, 가위표는 제거를 뜻하는 경우가 많다.
- base(있을 수 있음): 수정 대상이 되는 현재 화면 스크린샷. 그림은 이 위에 겹쳐 그린 것이다.
- note(있을 수 있음): 사용자가 덧붙인 짧은 설명.

규칙:
- 코드를 작성하지 않는다. 무엇을 바꿔야 하는지만 기술한다.
- 그림에서 읽어낸 것만 적는다. 보이지 않는 것을 지어내지 않는다.
- 확신이 없으면 그 항목의 confidence를 낮추고, 필요하면 questions에 무엇이 불확실한지 적는다.
- target에는 화면에서 보이는 요소의 이름을 적는다(예: login-button, login-card).
- 파일 경로나 명령어를 적지 않는다. 그것은 다른 단계가 정한다.
- overallConfidence는 전체 해석을 얼마나 믿을 수 있는지다. 그림이 모호하면 낮춰라."""

@runtime_checkable
class VisionProvider(Protocol):
    async def interpret(
        self,
        canvas_image: bytes,
        base_image: bytes | None,
        typed_note: str | None,
    ) -> ProjectCommand: ...

class VisionError(RuntimeError):
    pass

def _data_url(image: bytes, mime: str) -> str:
    return f"data:{mime};base64,{base64.b64encode(image).decode()}"

class OpenAIVisionProvider:
    def __init__(
        self,
        api_key: str,
        *,
        model: str = "gpt-5.5",
        timeout: float = 120.0,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._timeout = timeout

    async def interpret(
        self,
        canvas_image: bytes,
        base_image: bytes | None = None,
        typed_note: str | None = None,
        *,
        canvas_mime: str = "image/png",
        base_mime: str = "image/png",
    ) -> ProjectCommand:
        content: list[dict] = []
        if base_image:
            content.append({"type": "text", "text": "base — 수정 대상 현재 화면:"})
            content.append(
                {"type": "image_url", "image_url": {"url": _data_url(base_image, base_mime)}}
            )
        content.append({"type": "text", "text": "canvas — 사용자가 그린 수정 의도:"})
        content.append(
            {"type": "image_url", "image_url": {"url": _data_url(canvas_image, canvas_mime)}}
        )
        if (typed_note or "").strip():
            content.append({"type": "text", "text": f"note: {typed_note.strip()}"})

        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": content},
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "project_command",
                    "strict": True,
                    "schema": json_schema(),
                },
            },
        }

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as http:
                response = await http.post(
                    ENDPOINT,
                    headers={"Authorization": f"Bearer {self._api_key}"},
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise VisionError(f"Vision 호출에 실패했습니다: {exc}") from exc

        if response.status_code != 200:
            # 키를 로그에 남기지 않는다. 본문만 잘라 남긴다.
            detail = response.text[:300]
            logger.error("Vision 오류 %s: %s", response.status_code, detail)
            raise VisionError(f"Vision이 오류를 반환했습니다({response.status_code}).")

        try:
            body = response.json()
            message = body["choices"][0]["message"]
            if message.get("refusal"):
                raise VisionError(f"해석이 거부되었습니다: {message['refusal'][:200]}")
            return ProjectCommand.model_validate(json.loads(message["content"]))
        except VisionError:
            raise
        except Exception as exc:
            raise VisionError(f"Vision 응답을 해석할 수 없습니다: {exc}") from exc
