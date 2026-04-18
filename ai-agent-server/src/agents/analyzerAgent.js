const gemini = require("../services/geminiService");

const SYSTEM = `Bạn là chuyên gia phân tích lỗi sai của học sinh trong môn Toán.
Nhiệm vụ: với bài toán được đưa ra, chỉ rõ những lỗi phổ biến học sinh hay mắc phải.
Định dạng JSON (không markdown, chỉ JSON thuần):
{
  "commonMistakes": [
    { "mistake": "mô tả lỗi sai", "reason": "tại sao học sinh hay sai", "example": "ví dụ sai cụ thể" }
  ],
  "warningPoints": ["điểm cần chú ý 1", "điểm cần chú ý 2"],
  "difficulty": "easy | medium | hard"
}`;

async function analyzerAgent(question) {
  const raw = await gemini.ask(SYSTEM, question);
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

module.exports = { analyzerAgent };
