import { NextRequest } from "next/server";
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

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { action, blocks, blockType } = body;

    const genAI  = getClient();
    const model  = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
    }

    else if (action === "improve") {
      systemPrompt = `Bạn là chuyên gia viết AI prompt. Hãy viết lại prompt dưới đây để chuyên nghiệp hơn, rõ ràng hơn và hiệu quả hơn. Giữ nguyên ý định gốc. Trả về plain text, giữ cấu trúc block nếu có.

Prompt gốc:
${promptText}`;
    }

    else if (action === "autocomplete") {
      systemPrompt = `Bạn là chuyên gia viết AI prompt. Dựa vào context hiện tại, gợi ý 3 nội dung khác nhau cho phần "${blockType}" của prompt. Trả về JSON hợp lệ (không markdown):
{
  "suggestions": [<3 gợi ý bằng tiếng Việt, mỗi cái 1-3 câu, phù hợp context>]
}

Context từ các phần đã có:
${promptText || "(Chưa có nội dung nào)"}`;
    }

    else {
      return Response.json({ error: "Action không hợp lệ." }, { status: 400 });
    }

    const result = await model.generateContent(systemPrompt);
    const text   = result.response.text().trim();

    if (action === "improve") {
      return Response.json({ result: text });
    }

    // Parse JSON for analyze / autocomplete
    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    return Response.json(JSON.parse(cleaned));

  } catch (err) {
    console.error("[prompt-builder API]", err);
    return Response.json({ error: "Lỗi xử lý AI." }, { status: 500 });
  }
}
