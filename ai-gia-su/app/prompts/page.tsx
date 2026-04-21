"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Copy, Check, ArrowRight, Plus } from "lucide-react";
import type { Prompt } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/supabase";
import SubmitPromptModal from "@/components/SubmitPromptModal";
import Navbar from "@/components/Navbar";

const ALL = "Tất cả";

const CATEGORY_COLORS: Record<string, string> = {
  "Toán học":  "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  "Văn học":   "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400",
  "Lập trình": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  "Ngoại ngữ": "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  "Khoa học":  "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400",
  "Khác":      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

// ── Prompt Card ───────────────────────────────────────────────────────────────
function PromptCard({
  prompt,
  onUse,
  onUpvote,
}: {
  prompt: Prompt;
  onUse: (template: string) => void;
  onUpvote: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [voted,    setVoted]    = useState(false);
  const [upvotes,  setUpvotes]  = useState(prompt.upvotes);

  const handleUpvote = () => {
    if (voted) return;
    setVoted(true);
    setUpvotes((v) => v + 1);
    onUpvote(prompt.id);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.template).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isLong = prompt.template.length > 150;

  return (
    <div className="surface rounded-2xl shadow-sm card-hover flex flex-col gap-3 p-5">
      {/* Category + upvote */}
      <div className="flex items-start justify-between gap-2">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${CATEGORY_COLORS[prompt.category] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}>
          {prompt.category}
        </span>
        <button
          onClick={handleUpvote}
          disabled={voted}
          title={voted ? "Đã upvote" : "Upvote"}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all flex-shrink-0
            ${voted
              ? "border-violet-300 text-violet-600 bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:bg-violet-950/40"
              : "border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 dark:hover:border-violet-700 dark:hover:text-violet-400 dark:hover:bg-violet-950/30"
            }`}
        >
          <span className="text-[10px]">{voted ? "▲" : "△"}</span>
          <span>{upvotes}</span>
        </button>
      </div>

      {/* Title + description */}
      <div>
        <h3 className="font-display font-semibold text-zinc-900 dark:text-zinc-50 text-sm leading-snug">{prompt.title}</h3>
        {prompt.description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{prompt.description}</p>
        )}
      </div>

      {/* Template */}
      <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3 border border-zinc-100 dark:border-zinc-700/50">
        <p className={`text-xs text-zinc-700 dark:text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap break-words ${!expanded && isLong ? "line-clamp-4" : ""}`}>
          {prompt.template}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-0.5 text-[11px] text-violet-500 hover:text-violet-700 dark:hover:text-violet-400 mt-1.5 transition-colors"
          >
            {expanded ? "Thu gọn" : "Xem đầy đủ"}
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {/* Author + date */}
      <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
        {prompt.author_name} · {new Date(prompt.created_at).toLocaleDateString("vi-VN")}
      </p>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          {copied ? "Đã sao chép" : "Sao chép"}
        </button>
        <button
          onClick={() => onUse(prompt.template)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 hover:opacity-90 text-white font-medium transition-all shadow-sm shadow-violet-200 dark:shadow-violet-900/30"
        >
          Dùng ngay <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="surface rounded-2xl p-5 h-64 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-1/4" />
        <div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-10" />
      </div>
      <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full w-3/4 mb-2" />
      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full w-full mb-1" />
      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full w-5/6 mb-4" />
      <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl h-20" />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PromptsPage() {
  const router = useRouter();
  const [prompts,   setPrompts]   = useState<Prompt[]>([]);
  const [category,  setCategory]  = useState(ALL);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = category !== ALL ? `?category=${encodeURIComponent(category)}` : "";
    fetch(`/api/prompts${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPrompts(data);
        else setError(data.error ?? "Lỗi tải dữ liệu.");
      })
      .catch(() => setError("Lỗi kết nối."))
      .finally(() => setLoading(false));
  }, [category]);

  const handleUse = (template: string) => {
    router.push(`/?prompt=${encodeURIComponent(template)}`);
  };

  const handleUpvote = (id: string) => {
    fetch(`/api/prompts/${id}/upvote`, { method: "POST" });
  };

  const handleSubmitted = (newPrompt: Prompt) => {
    setPrompts((prev) => [newPrompt, ...prev]);
    setModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex items-end justify-between gap-4 mb-8">
          <div className="animate-fade-in">
            <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">
              Thư Viện <span className="gradient-text">Prompt</span>
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Cộng đồng đóng góp · {prompts.length} prompt
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Đóng góp
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-6 animate-fade-in">
          {[ALL, ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-150
                ${category === c
                  ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-sm shadow-violet-200 dark:shadow-violet-900/30"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400"
                }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">⚠️</p>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{error}</p>
            {error.includes("cấu hình") && (
              <p className="text-xs mt-2 text-zinc-400 dark:text-zinc-600">
                Thêm <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> vào{" "}
                <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">.env.local</code>
              </p>
            )}
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Chưa có prompt nào trong danh mục này.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="text-xs text-violet-500 hover:text-violet-700 dark:hover:text-violet-400 mt-2 transition-colors"
            >
              Là người đầu tiên đóng góp →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {prompts.map((p) => (
              <PromptCard key={p.id} prompt={p} onUse={handleUse} onUpvote={handleUpvote} />
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <SubmitPromptModal onClose={() => setModalOpen(false)} onSubmitted={handleSubmitted} />
      )}
    </div>
  );
}
