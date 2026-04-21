"use client";

import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { BlockType } from '@/lib/store/promptBuilderStore';

const blockTemplates: { type: BlockType; label: string; tooltip: string }[] = [
  { type: 'role', label: 'Vai Trò (Role)', tooltip: 'Đóng vai ai? (VD: Gia sư Toán, Chuyên gia Marketing)' },
  { type: 'context', label: 'Bối Cảnh (Context)', tooltip: 'Tình huống hiện tại là gì?' },
  { type: 'task', label: 'Nhiệm Vụ (Task)', tooltip: 'Cần AI làm cụ thể việc gì?' },
  { type: 'input', label: 'Đầu Vào (Input)', tooltip: 'Dữ liệu hoặc thông tin cần xử lý' },
  { type: 'constraints', label: 'Giới Hạn (Constraints)', tooltip: 'Những điều cấm hoặc bắt buộc (VD: Không giải hộ bài)' },
  { type: 'output', label: 'Đầu Ra (Output Format)', tooltip: 'Cách trình bày kết quả (VD: Bảng, Bullet point)' },
  { type: 'examples', label: 'Ví Dụ (Examples)', tooltip: 'Cung cấp ví dụ mẫu để AI học theo' },
];

export const BlockLibrary = () => {
  return (
    <div className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-4 h-full flex flex-col z-10 relative">
      <div className="mb-6">
        <h2 className="font-display text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <span>📚</span> Thư Viện Blocks
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Kéo thả các khối sang bên phải để xây dựng Prompt.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        {blockTemplates.map((template) => (
          <DraggableLibraryItem key={template.type} template={template} />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="bg-violet-50 dark:bg-violet-950/30 p-3 rounded-xl border border-violet-100 dark:border-violet-900">
          <h4 className="text-xs font-semibold text-violet-800 dark:text-violet-400 mb-1">💡 Mẹo nhỏ</h4>
          <p className="text-xs text-violet-600 dark:text-violet-400/80 leading-relaxed">
            Một Prompt chất lượng thường nên có ít nhất <b>Vai trò</b> và <b>Nhiệm vụ</b> rõ ràng.
          </p>
        </div>
      </div>
    </div>
  );
};

const DraggableLibraryItem = ({ template }: { template: { type: BlockType; label: string; tooltip: string } }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `template-${template.type}`,
    data: { type: template.type, isTemplate: true },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-md transition-all group flex items-center gap-3 ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      title={template.tooltip}
    >
      <GripVertical className="text-zinc-300 dark:text-zinc-600 w-4 h-4 group-hover:text-violet-400 transition-colors" />
      <span className="font-medium text-zinc-700 dark:text-zinc-300 text-sm group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">{template.label}</span>

      {/* Tooltip */}
      <div className="absolute left-full ml-2 w-48 p-2 bg-zinc-800 dark:bg-zinc-700 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
        {template.tooltip}
        <div className="absolute top-1/2 -left-1 -mt-1 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-zinc-800 dark:border-r-zinc-700" />
      </div>
    </div>
  );
};
