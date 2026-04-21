"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { Prompt } from "@/lib/types";
import { CATEGORIES } from "@/lib/supabase";
import SubmitPromptModal from "@/components/SubmitPromptModal";
import Navbar from "@/components/Navbar";
import { PromptCard } from "@/components/PromptCard";

const ALL = "Tất cả";

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 h-72 animate-pulse shadow-sm">
      <div className="flex justify-between mb-4">
        <div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-1/4" />
        <div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-10" />
      </div>
      <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full w-3/4 mb-2" />
      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full w-full mb-1" />
      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full w-5/6 mb-4" />
      <div className="bg-zinc-950 rounded-xl h-24 mb-3" />
      <div className="flex gap-2">
        <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full w-16" />
        <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full w-16" />
      </div>
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
            {prompts.map((p, i) => (
              <PromptCard key={p.id} prompt={p} onUse={handleUse} onUpvote={handleUpvote} featured={i === 0} />
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
