"use client";

import { useState } from "react";
import { Copy, Check, ChevronUp, ChevronDown } from "lucide-react";
import { usePromptStore } from "@/lib/store/promptBuilderStore";

// Extract unique {{variable}} names from a prompt string
function extractVariables(prompt: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of prompt.matchAll(/\{\{([^}]+)\}\}/g)) {
    const name = m[1].trim();
    if (!seen.has(name)) { seen.add(name); result.push(name); }
  }
  return result;
}

// Replace {{var}} with filled values; leave unfilled as-is
function resolveVariables(prompt: string, values: Record<string, string>): string {
  return prompt.replace(/\{\{([^}]+)\}\}/g, (match, name) => {
    const v = values[name.trim()];
    return v?.trim() ? v.trim() : match;
  });
}

export const PreviewPanel = () => {
  // Subscribe to blocks so we re-render when they change
  const blocks            = usePromptStore(s => s.blocks);
  const getGeneratedPrompt = usePromptStore(s => s.getGeneratedPrompt);

  const [copied,    setCopied]    = useState(false);
  const [expanded,  setExpanded]  = useState(false);
  const [varValues, setVarValues] = useState<Record<string, string>>({});

  const rawPrompt  = getGeneratedPrompt();
  const variables  = extractVariables(rawPrompt);
  const resolved   = resolveVariables(rawPrompt, varValues);
  const wordCount  = resolved ? resolved.trim().split(/\s+/).filter(Boolean).length : 0;

  // Count unfilled variables
  const unfilledCount = variables.filter(v => !varValues[v]?.trim()).length;

  const handleCopy = () => {
    if (!resolved) return;
    navigator.clipboard.writeText(resolved).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Render prompt with {{var}} highlighted (unfilled = amber, filled = green)
  function renderHighlighted(text: string) {
    const parts = text.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, i) => {
      const match = part.match(/^\{\{([^}]+)\}\}$/);
      if (!match) return <span key={i}>{part}</span>;
      const name  = match[1].trim();
      const value = varValues[name]?.trim();
      return value ? (
        <span key={i} className="bg-emerald-100 text-emerald-800 rounded px-0.5 font-medium">
          {value}
        </span>
      ) : (
        <span key={i} className="bg-amber-100 text-amber-700 rounded px-0.5 font-medium">
          {`{{${name}}}`}
        </span>
      );
    });
  }

  // Prevent re-using stale ref but intentionally keep unused keys (no cleanup needed)
  void blocks;

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
          {/* Badge for unfilled variables */}
          {variables.length > 0 && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-1 ${
              unfilledCount > 0
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            }`}>
              {unfilledCount > 0
                ? `${unfilledCount} biến chưa điền`
                : `✓ ${variables.length} biến đã điền`}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {!rawPrompt && (
            <span className="text-xs text-zinc-400 italic">Chưa có nội dung nào</span>
          )}
          {rawPrompt && (
            <button
              onClick={handleCopy}
              title={unfilledCount > 0 ? `Còn ${unfilledCount} biến chưa điền` : "Copy prompt"}
              className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                copied
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : unfilledCount > 0
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
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

      {/* Expanded section */}
      {expanded && (
        <>
          {/* Variable inputs — only when variables exist */}
          {variables.length > 0 && (
            <div className="border-t border-amber-100 px-6 py-4 bg-amber-50/60">
              <h4 className="text-xs font-semibold text-amber-800 mb-3 flex items-center gap-1.5">
                <span>🔤</span>
                Điền biến số ({variables.length} biến)
                <span className="text-xs font-normal text-amber-600">
                  — sẽ được thay vào prompt khi copy
                </span>
              </h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {variables.map(v => (
                  <div key={v} className="flex flex-col gap-1">
                    <label className="text-xs font-mono font-medium text-amber-700 truncate" title={`{{${v}}}`}>
                      {`{{${v}}}`}
                    </label>
                    <input
                      type="text"
                      className="text-xs px-2.5 py-1.5 border border-amber-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 placeholder:text-zinc-400"
                      placeholder={`Nhập ${v}…`}
                      value={varValues[v] ?? ""}
                      onChange={e =>
                        setVarValues(prev => ({ ...prev, [v]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompt preview */}
          <div className="border-t border-zinc-100 px-6 py-4 max-h-60 overflow-y-auto bg-zinc-50">
            {rawPrompt ? (
              <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-mono leading-relaxed">
                {variables.length > 0
                  ? renderHighlighted(rawPrompt)
                  : rawPrompt}
              </pre>
            ) : (
              <p className="text-sm text-zinc-400 italic text-center py-4">
                Kéo thả block vào Canvas và nhập nội dung để xem prompt tổng hợp ở đây...
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
