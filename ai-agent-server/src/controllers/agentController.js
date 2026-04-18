const agentService = require("../services/agentService");

async function ask(req, res, next) {
  try {
    const { question, history, model } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "question là trường bắt buộc và phải là chuỗi." });
    }

    const result = await agentService.getAnswer(question.trim(), history || [], model);

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { ask };
