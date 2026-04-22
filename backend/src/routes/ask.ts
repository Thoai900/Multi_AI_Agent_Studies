import { Router, Request, Response } from "express";

type HistoryMessage = { role: "user" | "assistant"; content: string };

const MODELS: Record<string, string> = {
  "claude-3-haiku":    "anthropic/claude-3-haiku",
  "claude-3.5-sonnet": "anthropic/claude-3-5-sonnet",
};
const DEFAULT_MODEL = "anthropic/claude-3-haiku";

const SYSTEM_PROMPT =
  "Bạn là gia sư AI thông minh, thân thiện và kiên nhẫn. Hãy giải thích mọi khái niệm một cách rõ ràng, dễ hiểu, sử dụng ví dụ thực tế khi cần thiết. Trả lời ngắn gọn, súc tích. Sử dụng tiếng Việt trừ khi người dùng yêu cầu ngôn ngữ khác.";

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured.");
  return key;
}

function userFacingError(status: number): string {
  if (status === 429) return "Đã vượt giới hạn request. Vui lòng thử lại sau vài giây.";
  if (status === 401 || status === 403) return "API key không hợp lệ hoặc hết hạn.";
  if (status === 402) return "Tài khoản OpenRouter chưa có credit.";
  return "Lỗi kết nối tới AI. Vui lòng thử lại.";
}

function sse(payload: object): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { question, history, model: modelId } = req.body as {
      question: string;
      history: HistoryMessage[];
      model?: string;
    };

    if (!question?.trim()) {
      res.status(400).json({ error: "question là trường bắt buộc." });
      return;
    }

    const apiKey = getApiKey();
    const model  = MODELS[modelId ?? ""] ?? DEFAULT_MODEL;
    const hist   = history ?? [];

    const messages = [
      { role: "system",    content: SYSTEM_PROMPT },
      ...hist.map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: question.trim() },
    ];

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer":  process.env.SITE_URL ?? "https://ai-gia-su.vercel.app",
        "X-Title":       "AI Gia Sư",
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ model, messages, stream: true }),
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: userFacingError(upstream.status) });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const reader  = upstream.body!.getReader();
    const decoder = new TextDecoder();
    let buffer    = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const raw = trimmed.slice(6).trim();

        if (raw === "[DONE]") {
          res.write(sse({ done: true, model }));
          res.end();
          return;
        }

        try {
          const parsed = JSON.parse(raw);
          const text   = parsed.choices?.[0]?.delta?.content;
          if (text) res.write(sse({ text }));
        } catch { /* skip malformed chunk */ }
      }
    }

    res.write(sse({ done: true, model }));
    res.end();
  } catch (err) {
    const msg = (err as Error)?.message ?? "";
    console.error("[/api/ask]", msg);
    if (!res.headersSent) {
      res.status(500).json({ error: `Lỗi server: ${msg || "không xác định"}` });
    }
  }
});

export default router;
