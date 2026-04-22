import os
import re
import json
import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai

router = APIRouter()

SCANNER_PROMPT = """Bạn là trợ lý AI phân tích bài tập học sinh Việt Nam từ ảnh chụp.

Hãy thực hiện 3 nhiệm vụ sau:

1. **Trích xuất văn bản** (extractedText): Đọc toàn bộ nội dung trong ảnh, bao gồm đề bài, công thức toán học, phương trình, sơ đồ (mô tả bằng chữ). Giữ nguyên cấu trúc gốc.

2. **Phân loại bài tập** (exerciseType): Xác định môn học và dạng bài cụ thể. Ví dụ: "Toán - Phương trình bậc 2", "Vật lý - Định luật Ohm", "Văn học - Phân tích đoạn văn", "Hóa học - Cân bằng phương trình".

3. **Đề xuất Prompt** (suggestedPrompt): Tạo một prompt chi tiết, rõ ràng để gửi cho AI gia sư, giúp giải quyết đúng bài tập này. Prompt phải bao gồm nội dung bài và yêu cầu cụ thể.

Trả về JSON hợp lệ với đúng 3 trường sau, không có text thừa:
{
  "extractedText": "...",
  "exerciseType": "...",
  "suggestedPrompt": "..."
}"""


def get_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(500, "GEMINI_API_KEY chưa được cấu hình.")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.5-flash")


class ScannerRequest(BaseModel):
    imageBase64: str
    mimeType: str = "image/jpeg"


@router.post("/")
async def scanner(body: ScannerRequest):
    if not body.imageBase64:
        raise HTTPException(400, "imageBase64 là trường bắt buộc.")

    model = get_model()

    try:
        image_data = base64.b64decode(body.imageBase64)
        result = model.generate_content([
            SCANNER_PROMPT,
            {"mime_type": body.mimeType, "data": image_data},
        ])

        raw = result.text
        cleaned = re.sub(r"^```json\s*", "", raw, flags=re.IGNORECASE)
        cleaned = re.sub(r"```\s*$", "", cleaned).strip()
        parsed = json.loads(cleaned)
        return parsed
    except json.JSONDecodeError:
        raise HTTPException(422, "Không thể phân tích phản hồi từ AI. Vui lòng thử ảnh rõ hơn.")
    except Exception as e:
        raise HTTPException(500, "Lỗi phân tích ảnh. Vui lòng thử lại.")
