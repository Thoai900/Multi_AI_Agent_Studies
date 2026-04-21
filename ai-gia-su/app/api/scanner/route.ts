import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured.");
  return new GoogleGenerativeAI(key);
}

const SCANNER_PROMPT = `Bạn là trợ lý AI phân tích bài tập học sinh Việt Nam từ ảnh chụp.

Hãy thực hiện 3 nhiệm vụ sau:

1. **Trích xuất văn bản** (extractedText): Đọc toàn bộ nội dung trong ảnh, bao gồm đề bài, công thức toán học, phương trình, sơ đồ (mô tả bằng chữ). Giữ nguyên cấu trúc gốc.

2. **Phân loại bài tập** (exerciseType): Xác định môn học và dạng bài cụ thể. Ví dụ: "Toán - Phương trình bậc 2", "Vật lý - Định luật Ohm", "Văn học - Phân tích đoạn văn", "Hóa học - Cân bằng phương trình".

3. **Đề xuất Prompt** (suggestedPrompt): Tạo một prompt chi tiết, rõ ràng để gửi cho AI gia sư, giúp giải quyết đúng bài tập này. Prompt phải bao gồm nội dung bài và yêu cầu cụ thể.

Trả về JSON hợp lệ với đúng 3 trường sau, không có text thừa:
{
  "extractedText": "...",
  "exerciseType": "...",
  "suggestedPrompt": "..."
}`;

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return Response.json({ error: "imageBase64 là trường bắt buộc." }, { status: 400 });
    }

    const genAI = getClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: SCANNER_PROMPT },
            {
              inlineData: {
                mimeType: mimeType ?? "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const raw = result.response.text();

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let parsed: { extractedText: string; exerciseType: string; suggestedPrompt: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return Response.json({ error: "Không thể phân tích phản hồi từ AI. Vui lòng thử ảnh rõ hơn." }, { status: 422 });
    }

    return Response.json(parsed);
  } catch (err: unknown) {
    console.error("[/api/scanner]", err);
    const msg = (err as Error)?.message ?? "";
    if (msg.includes("GEMINI_API_KEY")) {
      return Response.json({ error: "Server chưa cấu hình API key." }, { status: 500 });
    }
    return Response.json({ error: "Lỗi phân tích ảnh. Vui lòng thử lại." }, { status: 500 });
  }
}
