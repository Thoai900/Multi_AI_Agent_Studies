import { Router, Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Action = "analyze" | "improve" | "autocomplete";

interface RequestBody {
  action: Action;
  blocks: { type: string; content: string; enabled: boolean }[];
  blockType?: string;
}

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY chưa được cấu hình.");
  return new GoogleGenerativeAI(key);
}

function buildPromptText(blocks: RequestBody["blocks"]) {
  return blocks
    .filter(b => b.enabled && b.content.trim())
    .map(b => `[${b.type.toUpperCase()}]: ${b.content.trim()}`)
    .join("\n\n");
}

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const body = req.body as RequestBody;
    const { action, blocks, blockType } = body;

    const genAI      = getClient();
    const model      = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
      systemPrompt = `Bạn là chuyên gia viết AI prompt. Hãy viết lại prompt dưới đây để chuyên nghiệp hơn, rõ ràng hơn và hiệu quả hơn. Giữ nguyên ý định gốc. Trả về plain text, giữ cấu trúc block nếu có.

Prompt gốc:
${promptText}`;
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

    const result = await model.generateContent(systemPrompt);
    const text   = result.response.text().trim();

    if (action === "improve") {
      res.json({ result: text });
      return;
    }

    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    res.json(JSON.parse(cleaned));
  } catch (err) {
    console.error("[/api/prompt-builder]", err);
    res.status(500).json({ error: "Lỗi xử lý AI." });
  }
});

export default router;
