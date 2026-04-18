const gemini = require("../services/geminiService");

const SYSTEM = `Bạn là chuyên gia lập lộ trình học Toán cá nhân hóa.
Nhiệm vụ: dựa vào bài toán học sinh đang học, đề xuất bài học tiếp theo và lộ trình học hợp lý.
Định dạng JSON (không markdown, chỉ JSON thuần):
{
  "currentTopic": "chủ đề hiện tại của bài toán",
  "nextTopics": [
    { "topic": "tên chủ đề", "reason": "tại sao nên học tiếp", "estimatedTime": "thời gian ước tính" }
  ],
  "roadmap": [
    { "week": 1, "goal": "mục tiêu tuần", "topics": ["chủ đề 1", "chủ đề 2"] }
  ],
  "practiceProblems": ["dạng bài 1 nên luyện", "dạng bài 2 nên luyện"]
}`;

async function plannerAgent(question) {
  const raw = await gemini.ask(SYSTEM, question);
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

module.exports = { plannerAgent };
