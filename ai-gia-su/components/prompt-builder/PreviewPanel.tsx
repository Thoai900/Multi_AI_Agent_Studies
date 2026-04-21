"use client";

import { useState } from "react";
import { Copy, Check, ChevronUp, ChevronDown } from "lucide-react";
import { usePromptStore } from "@/lib/store/promptBuilderStore";

export const PreviewPanel = () => {
  const getGeneratedPrompt = usePromptStore(s => s.getGeneratedPrompt);
  const [copied,   setCopied]   = useState(false);
  const [expanded, setExpanded] = useState(false);

  const prompt    = getGeneratedPrompt();
  const wordCount = prompt ? prompt.trim().split(/\s+/).filter(Boolean).length : 0;

  const handleCopy = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex-shrink-0 border-t border-zinc-200 bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.05)] z-10">
      {/* Toggle bar */}
      <div className="flex items-center justify-between px-6 py-2.5">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:text-violet-600 transition-colors"
        >
          {expanded
            ? <ChevronDown className="w-4 h-4" />
            : <ChevronUp   className="w-4 h-4" />}
          Preview Prompt Hoàn Chỉnh
          {wordCount > 0 && (
            <span className="text-xs font-normal text-zinc-400 ml-1">
              · {wordCount} từ
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {!prompt && (
            <span className="text-xs text-zinc-400 italic">
              Chưa có nội dung nào
            </span>
          )}
          {prompt && (
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                copied
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
              }`}
            >
              {copied
                ? <><Check className="w-3.5 h-3.5" /> Đã copy!</>
                : <><Copy className="w-3.5 h-3.5" /> Copy Prompt</>}
            </button>
          )}
        </div>
      </div>

      {/* Expanded preview */}
      {expanded && (
        <div className="border-t border-zinc-100 px-6 py-4 max-h-60 overflow-y-auto bg-zinc-50">
          {prompt ? (
            <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-mono leading-relaxed">
              {prompt}
            </pre>
          ) : (
            <p className="text-sm text-zinc-400 italic text-center py-4">
              Kéo thả block vào Canvas và nhập nội dung để xem prompt tổng hợp ở đây...
            </p>
          )}
        </div>
      )}
    </div>
  );
};
