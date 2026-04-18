const express = require("express");
const cors = require("cors");
const agentRoutes      = require("./routes/agentRoutes");
const mathTutorRoutes  = require("./routes/mathTutorRoutes");
const errorHandler     = require("./middlewares/errorHandler");

const app = express();

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (curl, Postman, etc.)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Routes
app.use("/api", agentRoutes);
app.use("/api", mathTutorRoutes);

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// 404
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// Global error handler
app.use(errorHandler);

module.exports = app;
