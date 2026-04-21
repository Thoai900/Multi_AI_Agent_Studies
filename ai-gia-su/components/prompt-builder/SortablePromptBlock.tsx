"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { usePromptStore, PromptBlock } from '@/lib/store/promptBuilderStore';

interface SortablePromptBlockProps {
  block: PromptBlock;
}

export const SortablePromptBlock = ({ block }: SortablePromptBlockProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: block.id,
    data: { type: block.type, isCanvasArea: true },
  });

  const updateBlock = usePromptStore(state => state.updateBlock);
  const toggleBlock = usePromptStore(state => state.toggleBlock);
  const removeBlock = usePromptStore(state => state.removeBlock);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 mb-3 border rounded-2xl shadow-sm transition-all bg-white dark:bg-zinc-900 hover:border-violet-200 dark:hover:border-violet-800 ${
        !block.enabled ? 'opacity-50' : 'opacity-100'
      } border-zinc-200 dark:border-zinc-700`}
    >
      <div className="flex justify-between items-center mb-3">
        {/* Drag handle */}
        <div
          className="flex items-center gap-2 cursor-grab active:cursor-grabbing hover:bg-zinc-50 dark:hover:bg-zinc-800 p-1 rounded-lg"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5 text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400" />
          <span className="font-semibold text-violet-700 dark:text-violet-400 capitalize bg-violet-50 dark:bg-violet-950/40 px-2 py-1 rounded-lg text-xs border border-violet-100 dark:border-violet-900">
            {block.type}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <label className="flex items-center cursor-pointer group">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={block.enabled} onChange={() => toggleBlock(block.id)} />
              <div className={`block w-10 h-6 rounded-full transition-colors ${block.enabled ? 'bg-gradient-to-r from-violet-600 to-purple-500' : 'bg-zinc-300 dark:bg-zinc-700 group-hover:bg-zinc-400'}`} />
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${block.enabled ? 'transform translate-x-4' : ''}`} />
            </div>
          </label>
          <button
            className="text-zinc-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            onClick={() => removeBlock(block.id)}
            title="Xóa block này"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <textarea
        className="w-full p-3 text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 dark:focus:border-violet-600 resize-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-sans"
        value={block.content}
        onChange={(e) => updateBlock(block.id, e.target.value)}
        rows={3}
        placeholder={`Nhập thông tin cho phần ${block.type} vào đây nhé...`}
        disabled={!block.enabled}
      />
    </div>
  );
};
