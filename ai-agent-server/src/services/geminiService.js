const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Shared helper — send a prompt to Gemini and return plain text.
 * @param {string} systemInstruction
 * @param {string} prompt
 * @param {string} [model]
 */
async function ask(systemInstruction, prompt, model = "gemini-2.5-flash") {
  const instance = genAI.getGenerativeModel({ model, systemInstruction });
  const result = await instance.generateContent(prompt);
  return result.response.text().trim();
}

module.exports = { ask };
