import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

type HistoryMessage = { role: "user" | "assistant"; content: string };

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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured.");
  return new GoogleGenerativeAI(key);
}

function sse(payload: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function errorMsg(err: unknown): string {
  const status = (err as { status?: number })?.status;
  const msg    = (err as Error)?.message ?? "";
  if (msg.includes("GEMINI_API_KEY is not configured")) return "Server chưa cấu hình API key.";
  if (status === 503) return "Model đang quá tải. Đang thử model khác…";
  if (status === 429) return "Đã vượt giới hạn request. Vui lòng chờ vài giây.";
  if (status === 401 || status === 403) return "API key không hợp lệ.";
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

export async function POST(req: NextRequest) {
  try {
    const { question, history, model: modelId } = await req.json();

    if (!question?.trim()) {
      return Response.json({ error: "question là trường bắt buộc." }, { status: 400 });
    }

    const q            = question.trim();
    const hist         = (history as HistoryMessage[]) || [];
    const startModel: string = ALLOWED_MODELS[modelId as keyof typeof ALLOWED_MODELS] ?? "gemini-2.5-flash";

    const readable = new ReadableStream({
      async start(controller) {
        let currentModel: string = startModel;

        for (let attempt = 0; attempt <= 3; attempt++) {
          try {
            const genAI = getClient();
            const model = genAI.getGenerativeModel({
              model: currentModel,
              systemInstruction: SYSTEM_PROMPT,
            });

            const chatHistory = hist.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            }));

            const chat   = model.startChat({ history: chatHistory });
            const result = await chat.sendMessageStream(q);

            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) controller.enqueue(sse({ text }));
            }

            controller.enqueue(sse({ done: true, model: currentModel }));
            controller.close();
            return;
          } catch (err) {
            const status = (err as { status?: number })?.status;

            if (status === 503) {
              const fallback = FALLBACK_CHAIN[currentModel];
              if (fallback) { currentModel = fallback; continue; }
            }
            if (status === 429 && attempt < 2) {
              await delay((attempt + 1) * 3000);
              continue;
            }

            controller.enqueue(sse({ error: errorMsg(err) }));
            controller.close();
            return;
          }
        }

        controller.enqueue(sse({ error: "Tất cả model đang quá tải. Vui lòng thử lại." }));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type":    "text/event-stream",
        "Cache-Control":   "no-cache, no-transform",
        "Connection":      "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[/api/ask]", err);
    return Response.json({ error: "Đã có lỗi xảy ra." }, { status: 500 });
  }
}
