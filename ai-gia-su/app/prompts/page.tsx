"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Prompt } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/supabase";
import SubmitPromptModal from "@/components/SubmitPromptModal";

const ALL = "Tất cả";

const CATEGORY_COLORS: Record<string, string> = {
  "Toán học":  "bg-blue-100 text-blue-700",
  "Văn học":   "bg-pink-100 text-pink-700",
  "Lập trình": "bg-emerald-100 text-emerald-700",
  "Ngoại ngữ": "bg-amber-100 text-amber-700",
  "Khoa học":  "bg-purple-100 text-purple-700",
  "Khác":      "bg-gray-100 text-gray-600",
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 p-5 flex flex-col gap-3">
      {/* Category + upvote */}
      <div className="flex items-start justify-between gap-2">
        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${CATEGORY_COLORS[prompt.category] ?? "bg-gray-100 text-gray-600"}`}>
          {prompt.category}
        </span>
        <button
          onClick={handleUpvote}
          disabled={voted}
          title={voted ? "Đã upvote" : "Upvote"}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all flex-shrink-0
            ${voted
              ? "border-indigo-200 text-indigo-600 bg-indigo-50"
              : "border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
        >
          <span className="text-[10px]">{voted ? "▲" : "△"}</span>
          <span>{upvotes}</span>
        </button>
      </div>

      {/* Title + description */}
      <div>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{prompt.title}</h3>
        {prompt.description && (
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{prompt.description}</p>
        )}
      </div>

      {/* Template */}
      <div className="bg-gray-50 rounded-xl p-3">
        <p className={`text-xs text-gray-700 font-mono leading-relaxed whitespace-pre-wrap break-words ${!expanded && isLong ? "line-clamp-4" : ""}`}>
          {prompt.template}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-[11px] text-indigo-500 hover:text-indigo-700 mt-1.5"
          >
            {expanded ? "Thu gọn ↑" : "Xem đầy đủ ↓"}
          </button>
        )}
      </div>

      {/* Author + date */}
      <p className="text-[10px] text-gray-400">
        {prompt.author_name} · {new Date(prompt.created_at).toLocaleDateString("vi-VN")}
      </p>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={handleCopy}
          className="flex-1 text-xs py-2 rounded-xl border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all"
        >
          {copied ? "✓ Đã sao chép" : "Sao chép"}
        </button>
        <button
          onClick={() => onUse(prompt.template)}
          className="flex-1 text-xs py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all"
        >
          Dùng ngay →
        </button>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 h-64 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-5 bg-gray-100 rounded-full w-1/4" />
        <div className="h-5 bg-gray-100 rounded-full w-10" />
      </div>
      <div className="h-4 bg-gray-100 rounded-full w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded-full w-full mb-1" />
      <div className="h-3 bg-gray-100 rounded-full w-5/6 mb-4" />
      <div className="bg-gray-50 rounded-xl p-3 h-20" />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PromptsPage() {
  const router = useRouter();
  const [prompts,    setPrompts]    = useState<Prompt[]>([]);
  const [category,   setCategory]   = useState(ALL);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [modalOpen,  setModalOpen]  = useState(false);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="text-gray-400 hover:text-gray-600 text-sm flex-shrink-0 transition-colors"
            >
              ← Chat
            </Link>
            <span className="text-gray-200 flex-shrink-0">|</span>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 truncate">Thư Viện Prompt</h1>
              <p className="text-xs text-gray-400">Cộng đồng đóng góp · {prompts.length} prompt</p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex-shrink-0 text-xs px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors shadow-sm shadow-indigo-200"
          >
            + Đóng góp
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {[ALL, ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all
                ${category === c
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
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
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">⚠️</p>
            <p className="text-sm font-medium text-gray-500">{error}</p>
            {error.includes("cấu hình") && (
              <p className="text-xs mt-2 text-gray-400">
                Thêm <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> và{" "}
                <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> vào{" "}
                <code className="bg-gray-100 px-1 rounded">.env.local</code>
              </p>
            )}
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-sm font-medium text-gray-500">Chưa có prompt nào trong danh mục này.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="text-xs text-indigo-500 hover:text-indigo-700 mt-2 transition-colors"
            >
              Là người đầu tiên đóng góp →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
