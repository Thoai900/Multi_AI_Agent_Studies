require("dotenv").config();

const app = require("./src/app");

const PORT = process.env.PORT || 5000;
const ENV  = process.env.NODE_ENV || "development";

// ── Start server ──────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`[server] env=${ENV} port=${PORT}`);
});

// ── Graceful shutdown (Render/Railway send SIGTERM before stopping) ────────────
function shutdown(signal) {
  console.log(`[server] ${signal} received — shutting down gracefully`);
  server.close(() => {
    console.log("[server] closed");
    process.exit(0);
  });

  // Force exit if connections hang for more than 10s
  setTimeout(() => {
    console.error("[server] forced exit after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

// ── Safety nets ───────────────────────────────────────────────────────────────
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err.message);
  shutdown("uncaughtException");
});
