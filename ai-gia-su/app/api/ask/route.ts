import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

const ALLOWED_MODELS = {
  "gemini-2.5-pro":   "gemini-2.5-pro",
  "gemini-2.5-flash": "gemini-2.5-flash",
} as const;

const FALLBACK_CHAIN: Record<string, string> = {
  "gemini-2.5-pro":   "gemini-2.5-flash",
  "gemini-2.5-flash": "gemini-2.0-flash",
};

const SYSTEM_PROMPT =
  "Bạn là gia sư AI thông minh, thân thiện và kiên nhẫn. Hãy giải thích mọi khái niệm một cách rõ ràng, dễ hiểu, sử dụng ví dụ thực tế khi cần thiết. Trả lời ngắn gọn, súc tích. Sử dụng tiếng Việt trừ khi người dùng yêu cầu ngôn ngữ khác.";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured.");
  return new GoogleGenerativeAI(key);
}

async function callGemini(
  modelId: string,
  history: HistoryMessage[],
  question: string
): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: modelId, systemInstruction: SYSTEM_PROMPT });

  const chatHistory = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history: chatHistory });
  const result = await chat.sendMessage(question);
  return result.response.text();
}

async function callWithRetry(
  modelId: string,
  history: HistoryMessage[],
  question: string,
  maxRetries = 2
): Promise<{ answer: string; modelUsed: string }> {
  let currentModel = modelId;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const answer = await callGemini(currentModel, history, question);
      return { answer, modelUsed: currentModel };
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number })?.status;

      if (status === 503) {
        const fallback = FALLBACK_CHAIN[currentModel];
        if (fallback) {
          console.warn(`[retry] ${currentModel} → 503, switching to ${fallback}`);
          currentModel = fallback;
          continue;
        }
      }

      if (status === 429 && attempt < maxRetries) {
        const waitMs = (attempt + 1) * 3000;
        console.warn(`[retry] 429 rate limit, waiting ${waitMs}ms...`);
        await delay(waitMs);
        continue;
      }

      throw err;
    }
  }

  throw lastError;
}

export async function POST(req: NextRequest) {
  try {
    const { question, history, model: modelId } = await req.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: "question là trường bắt buộc." }, { status: 400 });
    }

    const resolvedModel =
      ALLOWED_MODELS[modelId as keyof typeof ALLOWED_MODELS] ?? "gemini-2.5-flash";

    const { answer, modelUsed } = await callWithRetry(
      resolvedModel,
      (history as HistoryMessage[]) || [],
      question.trim()
    );

    return NextResponse.json({ answer, model: modelUsed });
  } catch (error: unknown) {
    console.error("[/api/ask]", error);

    const status = (error as { status?: number })?.status;
    const message = (error as Error)?.message ?? "";

    if (message.includes("GEMINI_API_KEY is not configured")) {
      return NextResponse.json(
        { error: "Server chưa cấu hình API key. Vui lòng liên hệ quản trị viên." },
        { status: 500 }
      );
    }
    if (status === 503) {
      return NextResponse.json(
        { error: "Tất cả model đang quá tải. Vui lòng thử lại sau ít phút." },
        { status: 503 }
      );
    }
    if (status === 429) {
      return NextResponse.json(
        { error: "Đã vượt giới hạn request. Vui lòng chờ vài giây rồi thử lại." },
        { status: 429 }
      );
    }
    if (status === 401 || status === 403) {
      return NextResponse.json(
        { error: "API key không hợp lệ. Vui lòng kiểm tra cấu hình." },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: "Đã có lỗi xảy ra. Vui lòng thử lại." }, { status: 500 });
  }
}
