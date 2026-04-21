import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured.");
  return new GoogleGenerativeAI(key);
}

const FLASHCARD_PROMPT = (text: string) => `
Từ nội dung học tập sau đây, hãy tạo 6 đến 8 thẻ ghi nhớ (flashcard) bao quát các khái niệm quan trọng nhất.

Yêu cầu:
- Mặt trước (front): câu hỏi hoặc khái niệm ngắn gọn
- Mặt sau (back): câu trả lời hoặc giải thích đầy đủ, rõ ràng
- Ưu tiên những điểm dễ quên hoặc hay bị nhầm lẫn

Trả về JSON array hợp lệ, không có text thừa:
[
  { "front": "...", "back": "..." }
]

Nội dung:
${text}
`;

const QUIZ_PROMPT = (text: string) => `
Từ nội dung học tập sau đây, hãy tạo 5 câu hỏi trắc nghiệm 4 đáp án để kiểm tra hiểu biết.

Yêu cầu:
- Câu hỏi rõ ràng, không mơ hồ
- Có đúng 1 đáp án chính xác, 3 đáp án nhiễu hợp lý
- Giải thích ngắn tại sao đáp án đúng
- Độ khó tăng dần từ câu 1 đến câu 5
- Trường "answer" là chỉ số (0-3) của đáp án đúng trong mảng options

Trả về JSON array hợp lệ, không có text thừa:
[
  {
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "answer": 0,
    "explanation": "..."
  }
]

Nội dung:
${text}
`;

async function generateJSON<T>(prompt: string): Promise<T> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned) as T;
}

export async function POST(req: NextRequest) {
  try {
    const { text, mode } = await req.json();

    if (!text?.trim()) {
      return Response.json({ error: "text là trường bắt buộc." }, { status: 400 });
    }
    if (mode !== "flashcards" && mode !== "quiz") {
      return Response.json({ error: "mode phải là 'flashcards' hoặc 'quiz'." }, { status: 400 });
    }

    if (mode === "flashcards") {
      const flashcards = await generateJSON<{ front: string; back: string }[]>(
        FLASHCARD_PROMPT(text)
      );
      return Response.json({ mode: "flashcards", data: flashcards });
    } else {
      const quiz = await generateJSON<
        { question: string; options: string[]; answer: number; explanation: string }[]
      >(QUIZ_PROMPT(text));
      return Response.json({ mode: "quiz", data: quiz });
    }
  } catch (err: unknown) {
    console.error("[/api/study]", err);
    const msg = (err as Error)?.message ?? "";
    if (msg.includes("GEMINI_API_KEY")) {
      return Response.json({ error: "Server chưa cấu hình API key." }, { status: 500 });
    }
    if (msg.includes("JSON")) {
      return Response.json({ error: "AI trả về định dạng không hợp lệ. Thử lại với nội dung khác." }, { status: 422 });
    }
    return Response.json({ error: "Lỗi tạo nội dung. Vui lòng thử lại." }, { status: 500 });
  }
}
