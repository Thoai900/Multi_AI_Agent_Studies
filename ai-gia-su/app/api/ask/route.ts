import { NextRequest } from "next/server";

type HistoryMessage = { role: "user" | "assistant"; content: string };

// ── Models available via OpenRouter ──────────────────────────────────────────
const MODELS: Record<string, string> = {
  "claude-3-haiku":    "anthropic/claude-3-haiku",
  "claude-3.5-sonnet": "anthropic/claude-3-5-sonnet",
};
const DEFAULT_MODEL = "anthropic/claude-3-haiku";

const SYSTEM_PROMPT =
  "Bạn là gia sư AI thông minh, thân thiện và kiên nhẫn. Hãy giải thích mọi khái niệm một cách rõ ràng, dễ hiểu, sử dụng ví dụ thực tế khi cần thiết. Trả lời ngắn gọn, súc tích. Sử dụng tiếng Việt trừ khi người dùng yêu cầu ngôn ngữ khác.";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured.");
  return key;
}

function sse(payload: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function userFacingError(status: number): string {
  if (status === 429) return "Đã vượt giới hạn request. Vui lòng thử lại sau vài giây.";
  if (status === 401 || status === 403) return "API key không hợp lệ hoặc hết hạn.";
  if (status === 402) return "Tài khoản OpenRouter chưa có credit.";
  return "Lỗi kết nối tới AI. Vui lòng thử lại.";
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { question, history, model: modelId } = await req.json();

    if (!question?.trim()) {
      return Response.json({ error: "question là trường bắt buộc." }, { status: 400 });
    }

    const apiKey = getApiKey();
    const model  = MODELS[modelId as string] ?? DEFAULT_MODEL;
    const q      = (question as string).trim();
    const hist   = (history as HistoryMessage[]) ?? [];

    // Build OpenAI-compatible message array
    const messages = [
      { role: "system",    content: SYSTEM_PROMPT },
      ...hist.map(m => ({
        role:    m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
      { role: "user", content: q },
    ];

    // Call OpenRouter (OpenAI-compatible endpoint)
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer":  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-gia-su.vercel.app",
        "X-Title":       "AI Gia Sư",
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ model, messages, stream: true }),
    });

    if (!upstream.ok) {
      return Response.json({ error: userFacingError(upstream.status) }, { status: upstream.status });
    }

    // Translate OpenRouter SSE → our SSE format and stream to client
    const readable = new ReadableStream({
      async start(controller) {
        const reader  = upstream.body!.getReader();
        const decoder = new TextDecoder();
        let buffer    = "";

        try {
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
                controller.enqueue(sse({ done: true, model }));
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(raw);
                const text   = parsed.choices?.[0]?.delta?.content;
                if (text) controller.enqueue(sse({ text }));
              } catch { /* skip malformed chunk */ }
            }
          }

          // Upstream closed without [DONE]
          controller.enqueue(sse({ done: true, model }));
          controller.close();
        } catch {
          controller.enqueue(sse({ error: "Lỗi kết nối. Vui lòng thử lại." }));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type":      "text/event-stream",
        "Cache-Control":     "no-cache, no-transform",
        "Connection":        "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const msg = (err as Error)?.message ?? "";
    console.error("[/api/ask] Lỗi:", msg);

    if (msg.includes("OPENROUTER_API_KEY")) {
      return Response.json(
        { error: "Server chưa cấu hình OPENROUTER_API_KEY. Thêm vào Vercel Dashboard → Environment Variables rồi redeploy." },
        { status: 500 },
      );
    }
    return Response.json(
      { error: `Lỗi server: ${msg || "không xác định"}` },
      { status: 500 },
    );
  }
}
