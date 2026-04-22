import "dotenv/config";
import express from "express";
import cors from "cors";

import askRouter from "./routes/ask";
import studyRouter from "./routes/study";
import scannerRouter from "./routes/scanner";
import promptBuilderRouter from "./routes/promptBuilder";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/ask", askRouter);
app.use("/api/study", studyRouter);
app.use("/api/scanner", scannerRouter);
app.use("/api/prompt-builder", promptBuilderRouter);

app.listen(PORT, () => {
  console.log(`[backend] Server chạy tại http://localhost:${PORT}`);
});
