const gemini = require("../services/geminiService");

const SYSTEM = `Bạn là gia sư Toán chuyên nghiệp, kiên nhẫn và rõ ràng.
Nhiệm vụ: giải bài toán từng bước một, giải thích lý do mỗi bước.
Định dạng JSON (không markdown, chỉ JSON thuần):
{
  "solution": "đáp án cuối cùng",
  "steps": [
    { "step": 1, "action": "tên bước", "detail": "giải thích chi tiết" }
  ],
  "formula": "công thức/định lý áp dụng (nếu có)"
}`;

async function tutorAgent(question) {
  const raw = await gemini.ask(SYSTEM, question);
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

module.exports = { tutorAgent };
