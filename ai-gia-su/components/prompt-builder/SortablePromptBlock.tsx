"use client";

import { useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ChevronDown } from "lucide-react";
import { usePromptStore, type PromptBlock } from "@/lib/store/promptBuilderStore";
import { blockMeta } from "@/lib/blockMeta";

function countVariables(content: string): number {
  return [...content.matchAll(/\{\{[^}]+\}\}/g)].length;
}

export const SortablePromptBlock = ({ block }: { block: PromptBlock }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id:   block.id,
    data: { type: block.type, isCanvasArea: true },
  });

  const updateBlock = usePromptStore(s => s.updateBlock);
  const toggleBlock = usePromptStore(s => s.toggleBlock);
  const removeBlock = usePromptStore(s => s.removeBlock);

  const [showTemplates, setShowTemplates] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const meta = blockMeta[block.type];
  const varCount = countVariables(block.content);

  const style = { transform: CSS.Transform.toString(transform), transition };

  const applyTemplate = (tpl: string) => {
    updateBlock(block.id, tpl);
    setShowTemplates(false);
  };

  const insertVariable = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? block.content.length;
    const end   = ta.selectionEnd   ?? block.content.length;
    const insert = "{{tên_biến}}";
    const next = block.content.slice(0, start) + insert + block.content.slice(end);
    updateBlock(block.id, next);
    // Move cursor to inside the braces
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + 2, start + insert.length - 2);
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-3 border rounded-2xl shadow-sm transition-all bg-white ${
        block.enabled
          ? "border-zinc-200 hover:border-violet-200"
          : "border-zinc-100 opacity-50"
      }`}
    >
      {/* Block header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        {/* Drag handle + label */}
        <div
          className="flex items-center gap-2 cursor-grab active:cursor-grabbing select-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-zinc-300 hover:text-zinc-500 flex-shrink-0" />
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${meta.badge}`}>
            {meta.emoji} {meta.label}
          </span>
          {/* Variable count badge */}
          {varCount > 0 && (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              {varCount} biến
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Insert variable button */}
          <button
            onClick={insertVariable}
            disabled={!block.enabled}
            title="Chèn biến {{tên_biến}}"
            className="text-xs text-zinc-400 hover:text-amber-600 transition-colors disabled:opacity-40 font-mono px-1.5 py-0.5 rounded hover:bg-amber-50"
          >
            {"{{}}"}
          </button>

          {/* Template picker */}
          <div className="relative">
            <button
              onClick={() => setShowTemplates(v => !v)}
              disabled={!block.enabled}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-violet-600 transition-colors disabled:opacity-40"
              title="Gợi ý mẫu"
            >
              Gợi ý <ChevronDown className="w-3 h-3" />
            </button>
            {showTemplates && (
              <div className="absolute right-0 top-7 w-80 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <p className="text-xs font-semibold text-zinc-500 px-3 pt-3 pb-1">
                  Chọn gợi ý mẫu:
                </p>
                {meta.templates.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => applyTemplate(tpl)}
                    className="w-full text-left px-3 py-2.5 text-xs text-zinc-700 hover:bg-violet-50 hover:text-violet-800 border-t border-zinc-100 first:border-t-0 transition-colors leading-relaxed whitespace-pre-wrap"
                  >
                    {tpl}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toggle */}
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={block.enabled}
                onChange={() => toggleBlock(block.id)}
              />
              <div className={`block w-9 h-5 rounded-full transition-colors ${
                block.enabled ? "bg-violet-600" : "bg-zinc-300"
              }`} />
              <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${
                block.enabled ? "translate-x-4" : ""
              }`} />
            </div>
          </label>

          {/* Delete */}
          <button
            onClick={() => removeBlock(block.id)}
            className="text-zinc-300 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors"
            title="Xóa block"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Textarea */}
      <div className="px-4 pb-4">
        <textarea
          ref={textareaRef}
          className="w-full p-3 text-sm text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 resize-none transition-all placeholder:text-zinc-400 leading-relaxed"
          value={block.content}
          onChange={e => updateBlock(block.id, e.target.value)}
          rows={3}
          placeholder={meta.placeholder}
          disabled={!block.enabled}
        />
      </div>

      {showTemplates && (
        <div className="fixed inset-0 z-40" onClick={() => setShowTemplates(false)} />
      )}
    </div>
  );
};
