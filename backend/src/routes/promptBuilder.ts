import { Router, Request, Response } from "express";

type Action = "analyze" | "improve" | "autocomplete";

interface RequestBody {
  action: Action;
  blocks: { type: string; content: string; enabled: boolean }[];
  blockType?: string;
  stream?: boolean;
}

const MODEL = "inclusionai/ling-2.6-flash:free";

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY chưa được cấu hình.");
  return key;
}

function buildPromptText(blocks: RequestBody["blocks"]) {
  return blocks
    .filter(b => b.enabled && b.content.trim())
    .map(b => `[${b.type.toUpperCase()}]: ${b.content.trim()}`)
    .join("\n\n");
}

async function callOpenRouter(systemPrompt: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${getApiKey()}`,
      "HTTP-Referer": process.env.SITE_URL ?? "https://ai-gia-su.vercel.app",
      "X-Title": "AI Gia Sư",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: systemPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }

  const data = await res.json() as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0].message.content.trim();
}

function sse(payload: object): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const body = req.body as RequestBody;
    const { action, blocks, blockType, stream: doStream } = body;

    const promptText = buildPromptText(blocks);

    let systemPrompt = "";

    if (action === "analyze") {
      systemPrompt = `Bạn là chuyên gia thiết kế AI prompt. Phân tích prompt dưới đây và trả về JSON hợp lệ (không có markdown, không có backtick):
{
  "score": <number 1-10>,
  "suggestions": [<tối đa 3 gợi ý ngắn bằng tiếng Việt, mỗi cái dưới 60 từ>],
  "missingBlocks": [<tên các phần còn thiếu bằng tiếng Việt>]
}

Prompt cần phân tích:
${promptText || "(Chưa có nội dung)"}`;
    } else if (action === "improve") {
      systemPrompt = `Bạn là chuyên gia viết AI prompt. Hãy viết lại prompt dưới đây để chuyên nghiệp hơn, rõ ràng hơn và hiệu quả hơn. Giữ nguyên ý định gốc và giữ nguyên cú pháp {{tên_biến}} nếu có. Trả về plain text, giữ cấu trúc block nếu có.

Prompt gốc:
${promptText}`;

      // ── SSE streaming mode ────────────────────────────────────────────────
      if (doStream) {
        const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${getApiKey()}`,
            "HTTP-Referer": process.env.SITE_URL ?? "https://ai-gia-su.vercel.app",
            "X-Title": "AI Gia Sư",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [{ role: "user", content: systemPrompt }],
            stream: true,
          }),
        });

        if (!upstream.ok) {
          res.status(upstream.status).json({ error: "Lỗi kết nối OpenRouter." });
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
              res.write(sse({ done: true }));
              res.end();
              return;
            }
            try {
              const parsed = JSON.parse(raw);
              const text   = parsed.choices?.[0]?.delta?.content;
              if (text) res.write(sse({ text }));
            } catch { /* skip malformed */ }
          }
        }

        res.write(sse({ done: true }));
        res.end();
        return;
      }
    } else if (action === "autocomplete") {
      systemPrompt = `Bạn là chuyên gia viết AI prompt. Dựa vào context hiện tại, gợi ý 3 nội dung khác nhau cho phần "${blockType}" của prompt. Trả về JSON hợp lệ (không markdown):
{
  "suggestions": [<3 gợi ý bằng tiếng Việt, mỗi cái 1-3 câu, phù hợp context>]
}

Context từ các phần đã có:
${promptText || "(Chưa có nội dung nào)"}`;
    } else {
      res.status(400).json({ error: "Action không hợp lệ." });
      return;
    }

    const text = await callOpenRouter(systemPrompt);

    if (action === "improve") {
      res.json({ result: text });
      return;
    }

    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    res.json(JSON.parse(cleaned));
  } catch (err) {
    console.error("[/api/prompt-builder]", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Lỗi xử lý AI." });
    }
  }
});

export default router;
