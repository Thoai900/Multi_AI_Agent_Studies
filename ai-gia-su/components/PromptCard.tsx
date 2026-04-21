"use client";

import { useState } from "react";
import { Copy, Check, ArrowRight, ChevronDown, Eye, X, Star, Zap } from "lucide-react";
import type { Prompt } from "@/lib/supabase";

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORY_BADGE: Record<string, string> = {
  "Toán học":  "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-900/60",
  "Văn học":   "bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400 border-pink-200 dark:border-pink-900/60",
  "Lập trình": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60",
  "Ngoại ngữ": "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-900/60",
  "Khoa học":  "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-900/60",
  "Khác":      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
};

const MODEL_MAP: Record<string, string[]> = {
  "Toán học":  ["Gemini", "Claude"],
  "Văn học":   ["Claude", "ChatGPT"],
  "Lập trình": ["Claude", "ChatGPT"],
  "Ngoại ngữ": ["ChatGPT", "Gemini"],
  "Khoa học":  ["Gemini", "Claude"],
  "Khác":      ["ChatGPT", "Claude"],
};

const MODEL_STYLE: Record<string, string> = {
  "ChatGPT": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
  "Claude":  "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200 dark:border-orange-900/50",
  "Gemini":  "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
};

const MODEL_DOT: Record<string, string> = {
  "ChatGPT": "bg-emerald-500",
  "Claude":  "bg-orange-500",
  "Gemini":  "bg-blue-500",
};

// Derive a stable pseudo-usage for display purposes
function displayUsage(upvotes: number, id: string): string {
  const seed  = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const count = (upvotes + 1) * (9 + (seed % 7));
  return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
}

// ── Preview Modal ─────────────────────────────────────────────────────────────

function PreviewModal({ prompt, onClose }: { prompt: Prompt; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.template).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 leading-snug truncate">
              {prompt.title}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{prompt.category}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-5 bg-zinc-950 mx-5 my-4 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500/70" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/70" />
            <div className="w-2 h-2 rounded-full bg-green-500/70" />
            <span className="ml-auto text-[10px] text-zinc-600 font-mono">prompt.txt</span>
          </div>
          <pre className="text-xs text-zinc-200 font-mono leading-relaxed whitespace-pre-wrap">
            {prompt.template}
          </pre>
        </div>

        {/* Modal footer */}
        <div className="px-5 pb-5">
          <button
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              copied
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                : "bg-gradient-to-r from-violet-600 to-purple-500 text-white hover:opacity-90 shadow-sm shadow-violet-200 dark:shadow-violet-900/30"
            }`}
          >
            {copied
              ? <><Check className="w-4 h-4" /> Đã copy!</>
              : <><Copy className="w-4 h-4" /> Copy Prompt</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Prompt Card ───────────────────────────────────────────────────────────────

export interface PromptCardProps {
  prompt:   Prompt;
  onUse:    (template: string) => void;
  onUpvote: (id: string) => void;
  featured?: boolean;
}

export function PromptCard({ prompt, onUse, onUpvote, featured = false }: PromptCardProps) {
  const [expanded,    setExpanded]    = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [voted,       setVoted]       = useState(false);
  const [upvotes,     setUpvotes]     = useState(prompt.upvotes);
  const [showPreview, setShowPreview] = useState(false);

  const handleUpvote = () => {
    if (voted) return;
    setVoted(true);
    setUpvotes(v => v + 1);
    onUpvote(prompt.id);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.template).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isLong   = prompt.template.length > 160;
  const models   = MODEL_MAP[prompt.category] ?? ["ChatGPT", "Claude"];
  const usage    = displayUsage(upvotes, prompt.id);
  const badgeCls = CATEGORY_BADGE[prompt.category] ?? CATEGORY_BADGE["Khác"];

  return (
    <>
      <article
        className={`group relative flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden h-full
          hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100/60 dark:hover:shadow-violet-900/25
          hover:border-violet-300 dark:hover:border-violet-700/70
          ${featured
            ? "border-violet-300 dark:border-violet-700/80 bg-white dark:bg-zinc-900 shadow-lg shadow-violet-100 dark:shadow-violet-900/30"
            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
          }`}
      >
        {/* Top accent line — appears on hover */}
        <div className="h-[2px] bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Featured badge */}
        {featured && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-sm">
            <Star className="w-2.5 h-2.5 fill-current" /> NỔI BẬT
          </div>
        )}

        <div className="flex flex-col flex-1 p-5 gap-3.5">

          {/* ① Category + Upvote */}
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeCls}`}>
              {prompt.category}
            </span>
            <button
              onClick={handleUpvote}
              disabled={voted}
              className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-all active:scale-95 flex-shrink-0
                ${voted
                  ? "border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                }`}
            >
              <span className="text-[10px]">{voted ? "▲" : "△"}</span>
              <span className="font-semibold tabular-nums">{upvotes}</span>
            </button>
          </div>

          {/* ② Title + description */}
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 leading-snug line-clamp-2 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors duration-200">
              {prompt.title}
            </h3>
            {prompt.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">
                {prompt.description}
              </p>
            )}
          </div>

          {/* ③ Template code block */}
          <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-2 h-2 rounded-full bg-red-500/60" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
              <div className="w-2 h-2 rounded-full bg-green-500/60" />
              <span className="ml-auto text-[10px] text-zinc-600 font-mono">prompt</span>
            </div>
            <p className={`text-[11px] text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap break-words ${!expanded && isLong ? "line-clamp-3" : ""}`}>
              {prompt.template}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-0.5 text-[10px] text-violet-400 hover:text-violet-300 mt-2 transition-colors"
              >
                {expanded ? "Thu gọn" : "Xem đầy đủ"}
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>

          {/* ④ Model tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {models.map(m => (
              <span
                key={m}
                className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${MODEL_STYLE[m]}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${MODEL_DOT[m]}`} />
                {m}
              </span>
            ))}
          </div>

          {/* ⑤ Meta: author + usage */}
          <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-600 mt-auto">
            <span className="truncate">{prompt.author_name} · {new Date(prompt.created_at).toLocaleDateString("vi-VN")}</span>
            <span className="flex items-center gap-1 flex-shrink-0 ml-2">
              <Zap className="w-3 h-3" />
              {usage} lần dùng
            </span>
          </div>

          {/* ⑥ Action buttons */}
          <div className="flex gap-1.5 pt-0.5">
            <button
              onClick={handleCopy}
              className={`flex-1 flex items-center justify-center gap-1 text-[11px] py-2 rounded-xl border font-medium transition-all active:scale-95
                ${copied
                  ? "border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                }`}
            >
              {copied
                ? <><Check className="w-3 h-3" /> Đã copy</>
                : <><Copy className="w-3 h-3" /> Copy</>}
            </button>

            <button
              onClick={() => setShowPreview(true)}
              className="flex-1 flex items-center justify-center gap-1 text-[11px] py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-violet-300 dark:hover:border-violet-700/70 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 font-medium transition-all active:scale-95"
            >
              <Eye className="w-3 h-3" /> Xem
            </button>

            <button
              onClick={() => onUse(prompt.template)}
              className="flex-1 flex items-center justify-center gap-1 text-[11px] py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 hover:opacity-90 text-white font-medium transition-all active:scale-95 shadow-sm shadow-violet-200 dark:shadow-violet-900/30"
            >
              Dùng <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </article>

      {showPreview && (
        <PreviewModal prompt={prompt} onClose={() => setShowPreview(false)} />
      )}
    </>
  );
}
