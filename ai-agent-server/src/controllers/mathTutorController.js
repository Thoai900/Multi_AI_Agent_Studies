const { tutorAgent }    = require("../agents/tutorAgent");
const { analyzerAgent } = require("../agents/analyzerAgent");
const { plannerAgent }  = require("../agents/plannerAgent");

/**
 * POST /api/math-tutor
 * Orchestrates 3 agents in parallel and merges results.
 */
async function solve(req, res, next) {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "question là trường bắt buộc." });
    }

    const q = question.trim();
    const startTime = Date.now();

    // ── Run all 3 agents in parallel ──────────────────────────────────────
    const [tutorResult, analyzerResult, plannerResult] = await Promise.allSettled([
      tutorAgent(q),
      analyzerAgent(q),
      plannerAgent(q),
    ]);

    const processingTime = Date.now() - startTime;

    // ── Unwrap settled results (agent failure ≠ request failure) ──────────
    const unwrap = (settled, agentName) => {
      if (settled.status === "fulfilled") return settled.value;
      console.error(`[${agentName}] failed:`, settled.reason?.message);
      return { error: `${agentName} không phản hồi được. Vui lòng thử lại.` };
    };

    return res.status(200).json({
      question: q,
      tutor:    unwrap(tutorResult,    "tutorAgent"),
      analyzer: unwrap(analyzerResult, "analyzerAgent"),
      planner:  unwrap(plannerResult,  "plannerAgent"),
      meta: {
        processingTime: `${processingTime}ms`,
        agentsUsed: ["tutorAgent", "analyzerAgent", "plannerAgent"],
        model: "gemini-2.5-flash",
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { solve };
