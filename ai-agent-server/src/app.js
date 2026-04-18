const express   = require("express");
const cors      = require("cors");
const agentRoutes     = require("./routes/agentRoutes");
const mathTutorRoutes = require("./routes/mathTutorRoutes");
const errorHandler    = require("./middlewares/errorHandler");

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Vercel preview deployments have dynamic URLs — match them by pattern
// Pattern env var example: multi-ai-agent-studies
const vercelProject = process.env.VERCEL_PROJECT_NAME || "";
const vercelPreviewRegex = vercelProject
  ? new RegExp(`^https://${vercelProject}[a-z0-9-]*\\.vercel\\.app$`)
  : null;

function isOriginAllowed(origin) {
  if (!origin) return true;                          // curl / Postman / server-to-server
  if (allowedOrigins.length === 0) return true;      // no list = allow all (dev)
  if (allowedOrigins.includes(origin)) return true;  // exact match
  if (vercelPreviewRegex?.test(origin)) return true; // Vercel preview URLs
  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true);
      callback(new Error(`CORS: origin "${origin}" not allowed`));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", agentRoutes);
app.use("/api", mathTutorRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", env: process.env.NODE_ENV, uptime: process.uptime() })
);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
