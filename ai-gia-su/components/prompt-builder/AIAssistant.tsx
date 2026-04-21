"use client";

import { useState } from 'react';
import { usePromptStore } from '@/lib/store/promptBuilderStore';
import { Sparkles, Wand2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AIAssistant = () => {
  const blocks = usePromptStore(state => state.blocks);
  const [isImproving, setIsImproving] = useState(false);

  const enabledBlocks = blocks.filter(b => b.enabled);
  const hasRole = enabledBlocks.some(b => b.type === 'role');
  const hasTask = enabledBlocks.some(b => b.type === 'task');

  let score = 0;
  if (enabledBlocks.length >= 2) score += 4;
  if (enabledBlocks.length >= 4) score += 3;
  if (enabledBlocks.length >= 6) score += 2;
  if (enabledBlocks.some(b => b.type === 'examples')) score += 1;
  if (enabledBlocks.length === 0) score = 0;

  const handleImprovePrompt = () => {
    setIsImproving(true);
    setTimeout(() => {
      alert("Tính năng gọi API OpenAI/Claude sẽ được tích hợp ở đây để cải thiện nội dung!");
      setIsImproving(false);
    }, 1500);
  };

  const scoreColor = score >= 8
    ? 'text-emerald-500 dark:text-emerald-400'
    : score >= 5
    ? 'text-amber-500 dark:text-amber-400'
    : 'text-red-500 dark:text-red-400';

  const barColor = score >= 8
    ? 'bg-emerald-500'
    : score >= 5
    ? 'bg-amber-500'
    : 'bg-red-500';

  return (
    <div className="w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 h-full flex flex-col z-10">
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
        <h2 className="font-display text-base font-bold text-violet-900 dark:text-violet-300 flex items-center gap-2">
          <span>🤖</span> Trợ Lý AI
        </h2>
        <p className="text-xs text-violet-700/70 dark:text-violet-400/70 mt-1">Đồng hành giúp bạn tạo Prompt xịn xò</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
        {/* Score */}
        <div className="surface rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Điểm chất lượng</h3>
            <span className={`text-lg font-bold ${scoreColor}`}>{score}/10</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${score * 10}%` }}
            />
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-violet-500" /> Phân tích tự động
          </h3>
          <div className="space-y-3">
            {blocks.length === 0 && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-500 dark:text-zinc-400 italic">
                Hãy kéo thả một vài khối nội dung để mình phân tích giúp bạn nhé.
              </div>
            )}

            {blocks.length > 0 && !hasRole && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-xl flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">⚠️</span>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  <b>Khuyên dùng:</b> Bạn nên thêm <b>Vai Trò</b> để AI xác định chuyên môn tốt hơn.
                </p>
              </div>
            )}

            {blocks.length > 0 && !hasTask && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl flex items-start gap-2">
                <span className="text-red-500 mt-0.5">⚠️</span>
                <p className="text-xs text-red-800 dark:text-red-300">
                  <b>Quan trọng:</b> Thiếu <b>Nhiệm Vụ</b> cụ thể! AI sẽ không biết làm gì.
                </p>
              </div>
            )}

            {hasRole && hasTask && score >= 7 && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  Cấu trúc cơ bản rất tốt! Hãy thêm chi tiết bên trong để tăng chất lượng nhé.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Magic tools */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" /> Công cụ ma thuật
          </h3>
          <div className="space-y-2">
            <button
              onClick={handleImprovePrompt}
              disabled={isImproving || enabledBlocks.length === 0}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                enabledBlocks.length === 0
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-purple-500 hover:opacity-90 text-white shadow-sm shadow-violet-200 dark:shadow-violet-900/30'
              }`}
            >
              {isImproving ? (
                <span className="animate-pulse">Đang tinh chỉnh...</span>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Nâng cấp văn phong (AI)
                </>
              )}
            </button>
            <button
              disabled={enabledBlocks.length === 0}
              className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                enabledBlocks.length === 0
                  ? 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                  : 'border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30'
              }`}
            >
              Tự động hoàn thiện (Auto Complete)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
