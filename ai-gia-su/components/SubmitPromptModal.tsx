"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { Prompt } from "@/lib/types";
import { CATEGORIES } from "@/lib/supabase";

type Props = {
  onClose: () => void;
  onSubmitted: (prompt: Prompt) => void;
};

export default function SubmitPromptModal({ onClose, onSubmitted }: Props) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    template: "",
    category: CATEGORIES[0] as string,
    author_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.template.trim()) {
      setError("Tiêu đề và nội dung prompt là bắt buộc.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Lỗi gửi prompt."); return; }
      onSubmitted(data);
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 block";
  const inputClass = "input-field";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 rounded-t-3xl z-10">
          <div>
            <h2 className="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Đóng góp Prompt</h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Chia sẻ prompt hay với cộng đồng</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-3 py-2">{error}</p>
          )}

          <div>
            <label className={labelClass}>Tiêu đề *</label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="VD: Giải thích khái niệm toán học"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Danh mục *</label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="input-field appearance-none cursor-pointer"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Mô tả ngắn</label>
            <input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Prompt này dùng để làm gì?"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Nội dung Prompt *</label>
            <textarea
              value={form.template}
              onChange={(e) => set("template", e.target.value)}
              placeholder="Bạn là gia sư chuyên về [môn học]. Hãy giải thích [khái niệm] theo từng bước..."
              rows={6}
              className="input-field resize-none font-mono"
            />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1">Dùng [dấu ngoặc vuông] để đánh dấu chỗ người dùng điền vào.</p>
          </div>

          <div>
            <label className={labelClass}>Tên của bạn</label>
            <input
              value={form.author_name}
              onChange={(e) => set("author_name", e.target.value)}
              placeholder="Ẩn danh"
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 justify-center"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang gửi…
                </>
              ) : "Đóng góp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
