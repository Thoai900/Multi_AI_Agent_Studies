"use client";

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { usePromptStore } from '@/lib/store/promptBuilderStore';
import { SortablePromptBlock } from './SortablePromptBlock';

export const MainCanvas = () => {
  const blocks = usePromptStore(state => state.blocks);

  const { isOver, setNodeRef } = useDroppable({
    id: 'main-canvas-droppable',
    data: { isCanvasArea: true },
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
      <div className="p-6 pb-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-10">
        <h2 className="font-display text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✍️</span> Canvas Thiết Kế Prompt
          </div>
          {blocks.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-900">
              {blocks.filter(b => b.enabled).length} khối đang bật
            </span>
          )}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Kéo các khối từ thư viện vào đây và sắp xếp theo thứ tự bạn muốn.</p>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-6 transition-colors scrollbar-thin ${isOver ? 'bg-violet-50/50 dark:bg-violet-950/10' : ''}`}
      >
        <div className="max-w-3xl mx-auto min-h-[400px]">
          {blocks.length === 0 ? (
            <div className="h-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center p-10 text-center min-h-[400px] bg-white/50 dark:bg-zinc-900/50">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">🧱</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Canvas đang trống</h3>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-md text-sm">
                Kéo một khối từ Thư viện bên trái thả vào đây để bắt đầu xây dựng Prompt của bạn.
              </p>
            </div>
          ) : (
            <SortableContext
              items={blocks.map(b => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {blocks.map((block) => (
                  <SortablePromptBlock key={block.id} block={block} />
                ))}
              </div>
            </SortableContext>
          )}

          {isOver && blocks.length > 0 && (
            <div className="mt-4 border-2 border-dashed border-violet-400 dark:border-violet-600 bg-violet-50/50 dark:bg-violet-950/20 p-4 rounded-xl flex items-center justify-center text-violet-500 dark:text-violet-400 font-medium text-sm">
              Thả vào đây...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
