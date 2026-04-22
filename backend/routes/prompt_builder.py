import os
import json
import re
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()

MODEL = "inclusionai/ling-2.6-flash:free"


class Block(BaseModel):
    type: str
    content: str
    enabled: bool


class PromptBuilderRequest(BaseModel):
    action: str
    blocks: list[Block]
    blockType: str | None = None
    stream: bool = False


def get_api_key() -> str:
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        raise HTTPException(500, "OPENROUTER_API_KEY chưa được cấu hình.")
    return key


def build_prompt_text(blocks: list[Block]) -> str:
    return "\n\n".join(
        f"[{b.type.upper()}]: {b.content.strip()}"
        for b in blocks
        if b.enabled and b.content.strip()
    )


def sse(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


async def call_openrouter(api_key: str, system_prompt: str) -> str:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": os.getenv("SITE_URL", "https://ai-gia-su.vercel.app"),
                "X-Title": "AI Gia Sư",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "messages": [{"role": "user", "content": system_prompt}],
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()


@router.post("/")
async def prompt_builder(body: PromptBuilderRequest):
    api_key = get_api_key()
    prompt_text = build_prompt_text(body.blocks)

    if body.action == "analyze":
        system_prompt = f"""Bạn là chuyên gia thiết kế AI prompt. Phân tích prompt dưới đây và trả về JSON hợp lệ (không có markdown, không có backtick):
{{
  "score": <number 1-10>,
  "suggestions": [<tối đa 3 gợi ý ngắn bằng tiếng Việt, mỗi cái dưới 60 từ>],
  "missingBlocks": [<tên các phần còn thiếu bằng tiếng Việt>]
}}

Prompt cần phân tích:
{prompt_text or "(Chưa có nội dung)"}"""

        text = await call_openrouter(api_key, system_prompt)
        cleaned = re.sub(r"^```(?:json)?\n?", "", text)
        cleaned = re.sub(r"\n?```$", "", cleaned).strip()
        return json.loads(cleaned)

    elif body.action == "improve":
        system_prompt = f"""Bạn là chuyên gia viết AI prompt. Hãy viết lại prompt dưới đây để chuyên nghiệp hơn, rõ ràng hơn và hiệu quả hơn. Giữ nguyên ý định gốc và giữ nguyên cú pháp {{{{tên_biến}}}} nếu có. Trả về plain text, giữ cấu trúc block nếu có.

Prompt gốc:
{prompt_text}"""

        if body.stream:
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
                        json={
                            "model": MODEL,
                            "messages": [{"role": "user", "content": system_prompt}],
                            "stream": True,
                        },
                    ) as resp:
                        if resp.status_code != 200:
                            yield sse({"error": "Lỗi kết nối OpenRouter."})
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
                                    yield sse({"done": True})
                                    return
                                try:
                                    parsed = json.loads(raw)
                                    text = parsed["choices"][0]["delta"].get("content")
                                    if text:
                                        yield sse({"text": text})
                                except Exception:
                                    pass

                        yield sse({"done": True})

            return StreamingResponse(
                stream_generator(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache, no-transform",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",
                },
            )

        text = await call_openrouter(api_key, system_prompt)
        return {"result": text}

    elif body.action == "autocomplete":
        system_prompt = f"""Bạn là chuyên gia viết AI prompt. Dựa vào context hiện tại, gợi ý 3 nội dung khác nhau cho phần "{body.blockType}" của prompt. Trả về JSON hợp lệ (không markdown):
{{
  "suggestions": [<3 gợi ý bằng tiếng Việt, mỗi cái 1-3 câu, phù hợp context>]
}}

Context từ các phần đã có:
{prompt_text or "(Chưa có nội dung nào)"}"""

        text = await call_openrouter(api_key, system_prompt)
        cleaned = re.sub(r"^```(?:json)?\n?", "", text)
        cleaned = re.sub(r"\n?```$", "", cleaned).strip()
        return json.loads(cleaned)

    else:
        raise HTTPException(400, "action không hợp lệ.")
