const express    = require("express");
const cors       = require("cors");
const agentRoutes      = require("./routes/agentRoutes");
const mathTutorRoutes  = require("./routes/mathTutorRoutes");
const errorHandler     = require("./middlewares/errorHandler");

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const rawOrigins = process.env.ALLOWED_ORIGINS || "";
const allowedOrigins = rawOrigins
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // No origin = curl/Postman/server-to-server — always allow
      if (!origin) return callback(null, true);
      // No allowlist configured = allow all (useful for early dev/staging)
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin "${origin}" not allowed`));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body parsing (10 kb cap prevents large payload attacks) ───────────────────
app.use(express.json({ limit: "10kb" }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", agentRoutes);
app.use("/api", mathTutorRoutes);

// ── Health check (used by Render/Railway to confirm app is alive) ─────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", env: process.env.NODE_ENV, uptime: process.uptime() })
);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
