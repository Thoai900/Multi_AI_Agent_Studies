"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Trash2, LayoutTemplate, AlignLeft } from "lucide-react";
import { usePromptStore, type PromptBlock } from "@/lib/store/promptBuilderStore";
import { blockMeta } from "@/lib/blockMeta";
import { SortablePromptBlock } from "./SortablePromptBlock";

// ── Plain-text view ───────────────────────────────────────────────────────────
const PlainTextBlock = ({ block }: { block: PromptBlock }) => {
  const updateBlock = usePromptStore(s => s.updateBlock);
  const toggleBlock = usePromptStore(s => s.toggleBlock);
  const removeBlock = usePromptStore(s => s.removeBlock);
  const meta = blockMeta[block.type];

  return (
    <div className={`mb-5 transition-opacity ${block.enabled ? "" : "opacity-40"}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${meta.badge}`}>
          {meta.emoji} {meta.label}
        </span>
        {/* Toggle */}
        <label className="flex items-center cursor-pointer ml-auto">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={block.enabled}
              onChange={() => toggleBlock(block.id)}
            />
            <div className={`block w-8 h-4 rounded-full transition-colors ${
              block.enabled ? "bg-violet-600" : "bg-zinc-300"
            }`} />
            <div className={`absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full shadow-sm transition-transform ${
              block.enabled ? "translate-x-4" : ""
            }`} />
          </div>
        </label>
        <button
          onClick={() => removeBlock(block.id)}
          className="text-zinc-300 hover:text-red-500 p-0.5 rounded transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <textarea
        className="w-full p-3 text-sm text-zinc-700 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 resize-none transition-all placeholder:text-zinc-400 leading-relaxed"
        value={block.content}
        onChange={e => updateBlock(block.id, e.target.value)}
        rows={3}
        placeholder={meta.placeholder}
        disabled={!block.enabled}
      />
    </div>
  );
};

// ── Main Canvas ───────────────────────────────────────────────────────────────
export const MainCanvas = () => {
  const blocks    = usePromptStore(s => s.blocks);
  const clearAll  = usePromptStore(s => s.clearAll);
  const [viewMode, setViewMode] = useState<"canvas" | "text">("canvas");

  const { isOver, setNodeRef } = useDroppable({
    id:   "main-canvas-droppable",
    data: { isCanvasArea: true },
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 relative overflow-hidden">
      {/* Canvas header */}
      <div className="p-6 pb-3 border-b border-zinc-200 bg-white z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
            <span>✍️</span> Canvas Thiết Kế Prompt
          </h2>

          <div className="flex items-center gap-2">
            {blocks.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                {blocks.filter(b => b.enabled).length} khối đang bật
              </span>
            )}

            {/* Quick Switch toggle */}
            <div className="flex items-center bg-zinc-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("canvas")}
                title="Chế độ Kéo-thả"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "canvas"
                    ? "bg-white shadow-sm text-violet-700"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                Blocks
              </button>
              <button
                onClick={() => setViewMode("text")}
                title="Chế độ Văn bản thuần"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "text"
                    ? "bg-white shadow-sm text-violet-700"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                Text
              </button>
            </div>

            {blocks.length > 0 && (
              <button
                onClick={() => { if (window.confirm("Xoá toàn bộ canvas?")) clearAll(); }}
                className="text-xs text-zinc-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                Xoá tất cả
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-zinc-500 mt-1">
          {viewMode === "canvas"
            ? "Kéo các khối từ thư viện vào đây và sắp xếp theo thứ tự bạn muốn."
            : "Chỉnh sửa trực tiếp nội dung từng block — nhanh hơn cho người thành thạo."}
        </p>
      </div>

      {/* ── Canvas mode ── */}
      {viewMode === "canvas" && (
        <div
          ref={setNodeRef}
          className={`flex-1 overflow-y-auto p-6 transition-colors scrollbar-thin ${
            isOver ? "bg-violet-50/50" : ""
          }`}
        >
          <div className="max-w-3xl mx-auto min-h-[400px]">
            {blocks.length === 0 ? (
              <div className="h-full border-2 border-dashed border-zinc-300 rounded-2xl flex flex-col items-center justify-center p-10 text-center min-h-[400px] bg-white/50">
                <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🧱</span>
                </div>
                <h3 className="text-lg font-semibold text-zinc-700 mb-2">Canvas đang trống</h3>
                <p className="text-zinc-500 max-w-md text-sm">
                  Kéo một khối từ Thư viện bên trái thả vào đây, hoặc chọn <b>Bộ Mẫu Sẵn</b> để bắt đầu nhanh.
                </p>
              </div>
            ) : (
              <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {blocks.map(block => (
                    <SortablePromptBlock key={block.id} block={block} />
                  ))}
                </div>
              </SortableContext>
            )}

            {isOver && blocks.length > 0 && (
              <div className="mt-4 border-2 border-dashed border-violet-400 bg-violet-50/50 p-4 rounded-xl flex items-center justify-center text-violet-500 font-medium text-sm">
                Thả vào đây...
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Text mode ── */}
      {viewMode === "text" && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {blocks.length === 0 ? (
              <div className="border-2 border-dashed border-zinc-300 rounded-2xl flex flex-col items-center justify-center p-10 text-center min-h-[400px] bg-white/50">
                <span className="text-2xl mb-3">📝</span>
                <p className="text-zinc-500 text-sm">
                  Chuyển về chế độ <b>Blocks</b> để kéo thả block vào canvas trước.
                </p>
              </div>
            ) : (
              blocks.map(block => (
                <PlainTextBlock key={block.id} block={block} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
