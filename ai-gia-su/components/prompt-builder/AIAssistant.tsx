"use client";

import { useState } from "react";
import { usePromptStore } from "@/lib/store/promptBuilderStore";
import { Sparkles, Wand2, AlertCircle, CheckCircle2, X, Copy, Check } from "lucide-react";

export const AIAssistant = () => {
  const blocks = usePromptStore(state => state.blocks);

  const [isImproving,    setIsImproving]    = useState(false);
  const [isAnalyzing,    setIsAnalyzing]    = useState(false);
  const [improvedPrompt, setImprovedPrompt] = useState<string | null>(null);
  const [aiSuggestions,  setAiSuggestions]  = useState<string[]>([]);
  const [copiedImproved, setCopiedImproved] = useState(false);

  const enabledBlocks = blocks.filter(b => b.enabled);
  const hasRole = enabledBlocks.some(b => b.type === "role");
  const hasTask = enabledBlocks.some(b => b.type === "task");
  const hasOutput = enabledBlocks.some(b => b.type === "output");

  // Static score (instant, no API)
  let score = 0;
  if (enabledBlocks.length >= 1) score += 2;
  if (enabledBlocks.length >= 3) score += 2;
  if (enabledBlocks.length >= 5) score += 2;
  if (hasRole)   score += 1;
  if (hasTask)   score += 1;
  if (hasOutput) score += 1;
  if (enabledBlocks.some(b => b.type === "examples")) score += 1;
  if (enabledBlocks.length === 0) score = 0;

  const scoreColor =
    score >= 8 ? "text-emerald-500" :
    score >= 5 ? "text-amber-500"   : "text-red-500";

  const barColor =
    score >= 8 ? "bg-emerald-500" :
    score >= 5 ? "bg-amber-500"   : "bg-red-500";

  const handleImprove = async () => {
    if (enabledBlocks.length === 0) return;
    setIsImproving(true);
    setAiSuggestions([]);
    try {
      const res  = await fetch("/api/prompt-builder", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "improve", blocks }),
      });
      const data = await res.json();
      if (data.result) setImprovedPrompt(data.result);
    } catch { /* silent */ }
    finally { setIsImproving(false); }
  };

  const handleAnalyze = async () => {
    if (enabledBlocks.length === 0) return;
    setIsAnalyzing(true);
    try {
      const res  = await fetch("/api/prompt-builder", {
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

          {/* Static analysis */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Phân tích tức thời
            </h3>
            <div className="space-y-2">
              {blocks.length === 0 && (
                <p className="text-xs text-zinc-400 italic p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  Kéo block vào canvas để mình phân tích nhé.
                </p>
              )}
              {blocks.length > 0 && !hasRole && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                  <span className="mt-0.5 text-sm">⚠️</span>
                  <p className="text-xs text-amber-800">
                    <b>Nên có:</b> Block <b>Vai Trò</b> giúp AI hiểu chuyên môn cần thiết.
                  </p>
                </div>
              )}
              {blocks.length > 0 && !hasTask && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
                  <span className="mt-0.5 text-sm">🚨</span>
                  <p className="text-xs text-red-800">
                    <b>Thiếu quan trọng:</b> Block <b>Nhiệm Vụ</b> là bắt buộc — AI không biết làm gì nếu thiếu.
                  </p>
                </div>
              )}
              {blocks.length > 0 && !hasOutput && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
                  <span className="mt-0.5 text-sm">💡</span>
                  <p className="text-xs text-blue-800">
                    Thêm <b>Đầu Ra</b> để chỉ định cách AI trình bày kết quả.
                  </p>
                </div>
              )}
              {hasRole && hasTask && score >= 7 && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-emerald-800">
                    Cấu trúc cơ bản rất tốt! Thêm nội dung chi tiết để tăng điểm.
                  </p>
                </div>
              )}
            </div>
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
                  Đang nâng cấp...
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
      {improvedPrompt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div>
                <h3 className="font-semibold text-zinc-900">✨ Prompt đã được nâng cấp</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Bản do AI viết lại — chuyên nghiệp hơn</p>
              </div>
              <button
                onClick={() => setImprovedPrompt(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <pre className="text-sm text-zinc-700 whitespace-pre-wrap font-mono leading-relaxed bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                {improvedPrompt}
              </pre>
            </div>

            <div className="p-5 border-t border-zinc-100 flex gap-3">
              <button
                onClick={handleCopyImproved}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  copiedImproved
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-violet-600 hover:bg-violet-700 text-white"
                }`}
              >
                {copiedImproved
                  ? <><Check className="w-4 h-4" /> Đã copy!</>
                  : <><Copy className="w-4 h-4" /> Copy bản nâng cấp</>}
              </button>
              <button
                onClick={() => setImprovedPrompt(null)}
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
