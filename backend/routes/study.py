import os
import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai

router = APIRouter()

FLASHCARD_PROMPT = """Từ nội dung học tập sau đây, hãy tạo 6 đến 8 thẻ ghi nhớ (flashcard) bao quát các khái niệm quan trọng nhất.

Yêu cầu:
- Mặt trước (front): câu hỏi hoặc khái niệm ngắn gọn
- Mặt sau (back): câu trả lời hoặc giải thích đầy đủ, rõ ràng
- Ưu tiên những điểm dễ quên hoặc hay bị nhầm lẫn

Trả về JSON array hợp lệ, không có text thừa:
[
  {{ "front": "...", "back": "..." }}
]

Nội dung:
{text}"""

QUIZ_PROMPT = """Từ nội dung học tập sau đây, hãy tạo 5 câu hỏi trắc nghiệm 4 đáp án để kiểm tra hiểu biết.

Yêu cầu:
- Câu hỏi rõ ràng, không mơ hồ
- Có đúng 1 đáp án chính xác, 3 đáp án nhiễu hợp lý
- Giải thích ngắn tại sao đáp án đúng
- Độ khó tăng dần từ câu 1 đến câu 5
- Trường "answer" là chỉ số (0-3) của đáp án đúng trong mảng options

Trả về JSON array hợp lệ, không có text thừa:
[
  {{
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "answer": 0,
    "explanation": "..."
  }}
]

Nội dung:
{text}"""


def get_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(500, "GEMINI_API_KEY chưa được cấu hình.")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.5-flash")


def parse_json(raw: str):
    cleaned = re.sub(r"^```json\s*", "", raw, flags=re.IGNORECASE)
    cleaned = re.sub(r"```\s*$", "", cleaned).strip()
    return json.loads(cleaned)


class StudyRequest(BaseModel):
    text: str
    mode: str


@router.post("/")
async def study(body: StudyRequest):
    if not body.text.strip():
        raise HTTPException(400, "text là trường bắt buộc.")
    if body.mode not in ("flashcards", "quiz"):
        raise HTTPException(400, "mode phải là 'flashcards' hoặc 'quiz'.")

    model = get_model()

    try:
        if body.mode == "flashcards":
            result = model.generate_content(FLASHCARD_PROMPT.format(text=body.text))
            data = parse_json(result.text)
            return {"mode": "flashcards", "data": data}
        else:
            result = model.generate_content(QUIZ_PROMPT.format(text=body.text))
            data = parse_json(result.text)
            return {"mode": "quiz", "data": data}
    except json.JSONDecodeError:
        raise HTTPException(422, "AI trả về định dạng không hợp lệ. Thử lại với nội dung khác.")
    except Exception as e:
        raise HTTPException(500, "Lỗi tạo nội dung. Vui lòng thử lại.")
