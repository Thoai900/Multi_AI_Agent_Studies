const { chat } = require("./geminiService");

const SYSTEM_PROMPT =
  "Bạn là gia sư AI thông minh, thân thiện và kiên nhẫn. Hãy giải thích mọi khái niệm một cách rõ ràng, dễ hiểu, sử dụng ví dụ thực tế khi cần thiết. Trả lời ngắn gọn, súc tích. Sử dụng tiếng Việt trừ khi người dùng yêu cầu ngôn ngữ khác.";

async function getAnswer(question, history = [], modelId = "gemini-2.5-flash") {
  const { answer, modelUsed } = await chat({
    question,
    history,
    modelId,
    systemInstruction: SYSTEM_PROMPT,
  });

  return { answer, model: modelUsed, timestamp: new Date().toISOString() };
}

module.exports = { getAnswer };
