const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ALLOWED_MODELS = {
  "gemini-2.5-pro":   "gemini-2.5-pro",
  "gemini-2.5-flash": "gemini-2.5-flash",
};

const FALLBACK_CHAIN = {
  "gemini-2.5-pro":   "gemini-2.5-flash",
  "gemini-2.5-flash": "gemini-2.0-flash",
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Send a single prompt (no history) — used by agents.
 */
async function ask(systemInstruction, prompt, modelId = "gemini-2.5-flash") {
  const model = genAI.getGenerativeModel({ model: modelId, systemInstruction });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Send a message with conversation history — used by /api/ask.
 * Supports model fallback and retry on 503/429.
 */
async function chat({ question, history = [], modelId = "gemini-2.5-flash", systemInstruction }) {
  const resolvedModel = ALLOWED_MODELS[modelId] ?? "gemini-2.5-flash";
  return _chatWithRetry({ question, history, modelId: resolvedModel, systemInstruction });
}

async function _callChat({ question, history, modelId, systemInstruction }) {
  const model = genAI.getGenerativeModel({ model: modelId, systemInstruction });

  const chatHistory = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const session = model.startChat({ history: chatHistory });
  const result  = await session.sendMessage(question);
  return { answer: result.response.text(), modelUsed: modelId };
}

async function _chatWithRetry({ question, history, modelId, systemInstruction }, maxRetries = 2) {
  let currentModel = modelId;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await _callChat({ question, history, modelId: currentModel, systemInstruction });
    } catch (err) {
      lastError = err;
      const status = err.status;

      if (status === 503) {
        const fallback = FALLBACK_CHAIN[currentModel];
        if (fallback) { currentModel = fallback; continue; }
      }
      if (status === 429 && attempt < maxRetries) {
        await delay((attempt + 1) * 3000);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

module.exports = { ask, chat };
