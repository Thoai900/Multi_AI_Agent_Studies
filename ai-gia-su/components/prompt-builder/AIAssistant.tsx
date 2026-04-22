"use client";

import { useState } from "react";
import { usePromptStore } from "@/lib/store/promptBuilderStore";
import { Sparkles, Wand2, X, Copy, Check, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// ── Score helpers ─────────────────────────────────────────────────────────────
function calcScore(blocks: ReturnType<typeof usePromptStore.getState>["blocks"]) {
  const enabled = blocks.filter(b => b.enabled);
  let score = 0;
  if (enabled.length >= 1) score += 2;
  if (enabled.length >= 3) score += 2;
  if (enabled.length >= 5) score += 2;
  if (enabled.some(b => b.type === "role"))        score += 1;
  if (enabled.some(b => b.type === "task"))        score += 1;
  if (enabled.some(b => b.type === "output"))      score += 1;
  if (enabled.some(b => b.type === "examples"))    score += 1;
  if (enabled.length === 0) score = 0;
  return score;
}

type CheckItem = {
  label:   string;
  ok:      boolean;
  level:   "critical" | "important" | "tip";
  message: string;
};

function buildChecklist(blocks: ReturnType<typeof usePromptStore.getState>["blocks"]): CheckItem[] {
  const enabled = blocks.filter(b => b.enabled);
  const has = (t: string) => enabled.some(b => b.type === t);
  const hasContent = (t: string) =>
    enabled.some(b => b.type === t && b.content.trim().split(/\s+/).length >= 8);
  const hasVariables = enabled.some(b => /\{\{[^}]+\}\}/.test(b.content));
  const hasExamples  = has("examples");

  return [
    {
      label:   "Nhiệm Vụ",
      ok:      has("task"),
      level:   "critical",
      message: has("task")
        ? "Đã thiết lập — AI biết cần làm gì"
        : "Bắt buộc — thiếu block này AI không biết làm gì",
    },
    {
      label:   "Vai Trò",
      ok:      has("role"),
      level:   "important",
      message: has("role")
        ? "Đã thiết lập — AI biết đóng vai chuyên gia nào"
        : "Nên có — giúp AI trả lời đúng chuyên môn cần thiết",
    },
    {
      label:   "Định Dạng Đầu Ra",
      ok:      has("output"),
      level:   "important",
      message: has("output")
        ? "Đã thiết lập — AI sẽ trình bày theo yêu cầu"
        : "Nên có — không có, AI tự chọn cách trình bày tuỳ tiện",
    },
    {
      label:   "Giới Hạn",
      ok:      has("constraints"),
      level:   "tip",
      message: has("constraints")
        ? "Đã có ràng buộc cho AI"
        : "Tuỳ chọn — thêm để kiểm soát những điều AI không được làm",
    },
    {
      label:   "Nội dung đủ chi tiết",
      ok:      hasContent("task") && (has("role") ? hasContent("role") : true),
      level:   "important",
      message: hasContent("task")
        ? "Nội dung các block đủ chi tiết"
        : "Nhiệm Vụ quá ngắn — cần ít nhất 8 từ để AI hiểu đúng yêu cầu",
    },
    {
      label:   "Biến số {{}}",
      ok:      hasVariables,
      level:   "tip",
      message: hasVariables
        ? "Đang dùng biến số — prompt có thể tái sử dụng"
        : "Chưa dùng — thêm {{biến}} để prompt linh hoạt, dùng lại nhiều lần",
    },
    {
      label:   "Ví dụ minh hoạ",
      ok:      hasExamples,
      level:   "tip",
      message: hasExamples
        ? "Đã có ví dụ — AI hiểu rõ format mong muốn"
        : "Tuỳ chọn — thêm Ví Dụ giúp AI hiểu rõ hơn format kết quả bạn muốn",
    },
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────
export const AIAssistant = () => {
  const blocks = usePromptStore(s => s.blocks);

  const [isImproving,    setIsImproving]    = useState(false);
  const [isAnalyzing,    setIsAnalyzing]    = useState(false);
  const [improvedPrompt, setImprovedPrompt] = useState<string | null>(null);
  const [aiSuggestions,  setAiSuggestions]  = useState<string[]>([]);
  const [copiedImproved, setCopiedImproved] = useState(false);

  const enabledBlocks = blocks.filter(b => b.enabled);
  const score     = calcScore(blocks);
  const checklist = buildChecklist(blocks);

  const scoreColor = score >= 8 ? "text-emerald-500" : score >= 5 ? "text-amber-500" : "text-red-500";
  const barColor   = score >= 8 ? "bg-emerald-500"   : score >= 5 ? "bg-amber-500"   : "bg-red-500";

  // ── SSE streaming improve ──────────────────────────────────────────────────
  const handleImprove = async () => {
    if (enabledBlocks.length === 0) return;
    setIsImproving(true);
    setAiSuggestions([]);
    setImprovedPrompt("");

    try {
      const res = await fetch(`${API_BASE}/api/prompt-builder`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "improve", blocks, stream: true }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setImprovedPrompt((data as { result?: string }).result ?? null);
        return;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.text) setImprovedPrompt(prev => (prev ?? "") + payload.text);
            if (payload.done || payload.error) return;
          } catch { /* skip */ }
        }
      }
    } catch { /* silent */ }
    finally { setIsImproving(false); }
  };

  const handleAnalyze = async () => {
    if (enabledBlocks.length === 0) return;
    setIsAnalyzing(true);
    try {
      const res  = await fetch(`${API_BASE}/api/prompt-builder`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "analyze", blocks }),
      });
      const data = await res.json();
      if (Array.isArray(data.suggestions)) setAiSuggestions(data.suggestions);
    } catch { /* silent */ }
    finally { setIsAnalyzing(false); }
  };

  const handleCopyImproved = () => {
    if (!improvedPrompt) return;
    navigator.clipboard.writeText(improvedPrompt).then(() => {
      setCopiedImproved(true);
      setTimeout(() => setCopiedImproved(false), 2000);
    });
  };

  return (
    <>
      <div className="w-72 bg-white border-l border-zinc-200 h-full flex flex-col z-10 flex-shrink-0">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 bg-gradient-to-br from-violet-50 to-purple-50">
          <h2 className="text-sm font-bold text-violet-900 flex items-center gap-2">
            <span>🤖</span> Trợ Lý AI
          </h2>
          <p className="text-xs text-violet-600/70 mt-0.5">Đồng hành giúp bạn tạo Prompt xịn xò</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Score */}
          <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-zinc-700">Điểm chất lượng</h3>
              <span className={`text-lg font-bold ${scoreColor}`}>{score}/10</span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${score * 10}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              {score === 0 ? "Chưa có block nào." :
               score < 5  ? "Cần thêm nhiều block hơn." :
               score < 8  ? "Khá tốt, có thể cải thiện thêm." :
               "Cấu trúc rất tốt!"}
            </p>
          </div>

          {/* Detailed checklist */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Phân tích chi tiết
            </h3>

            {blocks.length === 0 ? (
              <p className="text-xs text-zinc-400 italic p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                Kéo block vào canvas để mình phân tích nhé.
              </p>
            ) : (
              <div className="space-y-2">
                {checklist.map(item => (
                  <div
                    key={item.label}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      item.ok
                        ? "bg-emerald-50 border-emerald-100"
                        : item.level === "critical"
                        ? "bg-red-50 border-red-100"
                        : item.level === "important"
                        ? "bg-amber-50 border-amber-100"
                        : "bg-zinc-50 border-zinc-100"
                    }`}
                  >
                    {item.ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    ) : item.level === "critical" ? (
                      <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className={`text-xs font-semibold ${
                        item.ok ? "text-emerald-800" :
                        item.level === "critical" ? "text-red-800" :
                        item.level === "important" ? "text-amber-800" :
                        "text-zinc-600"
                      }`}>
                        {item.label}
                      </p>
                      <p className={`text-xs mt-0.5 leading-relaxed ${
                        item.ok ? "text-emerald-700" :
                        item.level === "critical" ? "text-red-700" :
                        item.level === "important" ? "text-amber-700" :
                        "text-zinc-500"
                      }`}>
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI suggestions from analyze */}
          {aiSuggestions.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" /> Gợi ý từ AI
              </h3>
              <div className="space-y-2">
                {aiSuggestions.map((s, i) => (
                  <div key={i} className="p-3 bg-violet-50 border border-violet-100 rounded-xl">
                    <p className="text-xs text-violet-900 leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="border-t border-zinc-100 pt-4 space-y-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5" /> Công cụ AI
            </h3>

            <button
              onClick={handleImprove}
              disabled={isImproving || enabledBlocks.length === 0}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                enabledBlocks.length === 0
                  ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-600 to-purple-500 hover:opacity-90 text-white shadow-sm"
              }`}
            >
              {isImproving ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang viết lại...
                </span>
              ) : (
                <><Wand2 className="w-4 h-4" /> Nâng cấp văn phong</>
              )}
            </button>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || enabledBlocks.length === 0}
              className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                enabledBlocks.length === 0
                  ? "border-zinc-200 text-zinc-400 cursor-not-allowed"
                  : "border-violet-200 text-violet-600 hover:bg-violet-50"
              }`}
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                  Đang phân tích...
                </span>
              ) : (
                <><Sparkles className="w-4 h-4" /> Phân tích AI chi tiết</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Improved prompt modal */}
      {improvedPrompt !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div>
                <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
                  ✨ Prompt đã được nâng cấp
                  {isImproving && (
                    <span className="text-xs font-normal text-violet-500 animate-pulse">Đang viết...</span>
                  )}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Bản do AI viết lại — chuyên nghiệp hơn</p>
              </div>
              <button
                onClick={() => { setImprovedPrompt(null); setIsImproving(false); }}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <pre className="text-sm text-zinc-700 whitespace-pre-wrap font-mono leading-relaxed bg-zinc-50 rounded-xl p-4 border border-zinc-100 min-h-[80px]">
                {improvedPrompt || <span className="text-zinc-400 italic">Đang khởi tạo...</span>}
                {isImproving && (
                  <span className="inline-block w-0.5 h-4 bg-violet-500 ml-0.5 animate-pulse align-middle" />
                )}
              </pre>
            </div>

            <div className="p-5 border-t border-zinc-100 flex gap-3">
              <button
                onClick={handleCopyImproved}
                disabled={isImproving || !improvedPrompt}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  copiedImproved
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : isImproving || !improvedPrompt
                    ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                    : "bg-violet-600 hover:bg-violet-700 text-white"
                }`}
              >
                {copiedImproved
                  ? <><Check className="w-4 h-4" /> Đã copy!</>
                  : <><Copy className="w-4 h-4" /> Copy bản nâng cấp</>}
              </button>
              <button
                onClick={() => { setImprovedPrompt(null); setIsImproving(false); }}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-500 hover:bg-zinc-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
