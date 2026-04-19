"use client";

import { useState } from "react";
import type { Prompt } from "@/lib/supabase";
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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-semibold text-gray-900 text-sm">Đóng góp Prompt</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none w-6 h-6 flex items-center justify-center">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Tiêu đề *</label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="VD: Giải thích khái niệm toán học"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Danh mục *</label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition bg-white"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Mô tả ngắn</label>
            <input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Prompt này dùng để làm gì?"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Nội dung Prompt *</label>
            <textarea
              value={form.template}
              onChange={(e) => set("template", e.target.value)}
              placeholder="Bạn là gia sư chuyên về [môn học]. Hãy giải thích [khái niệm] theo từng bước..."
              rows={6}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition resize-none font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1">Dùng [dấu ngoặc vuông] để đánh dấu chỗ người dùng điền vào.</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Tên của bạn</label>
            <input
              value={form.author_name}
              onChange={(e) => set("author_name", e.target.value)}
              placeholder="Ẩn danh"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 text-sm py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white font-medium transition"
            >
              {loading ? "Đang gửi…" : "Đóng góp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
