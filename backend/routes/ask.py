import os
import json
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()

MODELS = {
    "claude-3-haiku":    "anthropic/claude-3-haiku",
    "claude-3.5-sonnet": "anthropic/claude-3-5-sonnet",
}
DEFAULT_MODEL = "anthropic/claude-3-haiku"

SYSTEM_PROMPT = (
    "Bạn là gia sư AI thông minh, thân thiện và kiên nhẫn. "
    "Hãy giải thích mọi khái niệm một cách rõ ràng, dễ hiểu, sử dụng ví dụ thực tế khi cần thiết. "
    "Trả lời ngắn gọn, súc tích. Sử dụng tiếng Việt trừ khi người dùng yêu cầu ngôn ngữ khác."
)

USER_FACING_ERRORS = {
    429: "Đã vượt giới hạn request. Vui lòng thử lại sau vài giây.",
    401: "API key không hợp lệ hoặc hết hạn.",
    403: "API key không hợp lệ hoặc hết hạn.",
    402: "Tài khoản OpenRouter chưa có credit.",
}


class HistoryMessage(BaseModel):
    role: str
    content: str


class AskRequest(BaseModel):
    question: str
    history: list[HistoryMessage] = []
    model: str | None = None


def sse(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


@router.post("/")
async def ask(body: AskRequest):
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(500, "OPENROUTER_API_KEY chưa được cấu hình.")

    if not body.question.strip():
        raise HTTPException(400, "question là trường bắt buộc.")

    model = MODELS.get(body.model or "", DEFAULT_MODEL)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *[{"role": m.role, "content": m.content} for m in body.history],
        {"role": "user", "content": body.question.strip()},
    ]

    async def stream_generator():
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream(
                "POST",
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "HTTP-Referer": os.getenv("SITE_URL", "https://ai-gia-su.vercel.app"),
                    "X-Title": "AI Gia Sư",
                    "Content-Type": "application/json",
                },
                json={"model": model, "messages": messages, "stream": True},
            ) as resp:
                if resp.status_code != 200:
                    error_msg = USER_FACING_ERRORS.get(resp.status_code, "Lỗi kết nối tới AI. Vui lòng thử lại.")
                    yield sse({"error": error_msg})
                    return

                buffer = ""
                async for chunk in resp.aiter_text():
                    buffer += chunk
                    lines = buffer.split("\n")
                    buffer = lines.pop()

                    for line in lines:
                        line = line.strip()
                        if not line.startswith("data: "):
                            continue
                        raw = line[6:].strip()
                        if raw == "[DONE]":
                            yield sse({"done": True, "model": model})
                            return
                        try:
                            parsed = json.loads(raw)
                            text = parsed["choices"][0]["delta"].get("content")
                            if text:
                                yield sse({"text": text})
                        except Exception:
                            pass

                yield sse({"done": True, "model": model})

    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
