/**
 * Placeholder AI service — swap this implementation for a real LLM call
 * (Gemini, OpenAI, Anthropic, etc.) without touching the controller.
 */
async function getAnswer(question) {
  // Simulate async processing delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    answer: `Đây là câu trả lời từ AI cho câu hỏi: "${question}"`,
    model: "mock-agent-v1",
    timestamp: new Date().toISOString(),
  };
}

module.exports = { getAnswer };
