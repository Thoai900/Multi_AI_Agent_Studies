"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { BlockType, PromptBlock, usePromptStore } from "@/lib/store/promptBuilderStore";

const blockTemplates: { type: BlockType; label: string; tooltip: string }[] = [
  { type: "role",        label: "Vai Trò (Role)",           tooltip: "Đóng vai ai? (VD: Gia sư Toán, Chuyên gia Marketing)" },
  { type: "context",     label: "Bối Cảnh (Context)",       tooltip: "Tình huống hiện tại là gì?" },
  { type: "task",        label: "Nhiệm Vụ (Task)",          tooltip: "Cần AI làm cụ thể việc gì?" },
  { type: "input",       label: "Đầu Vào (Input)",          tooltip: "Dữ liệu hoặc thông tin cần xử lý" },
  { type: "constraints", label: "Giới Hạn (Constraints)",   tooltip: "Những điều cấm hoặc bắt buộc" },
  { type: "output",      label: "Đầu Ra (Output Format)",   tooltip: "Cách trình bày kết quả (VD: Bảng, Bullet point)" },
  { type: "examples",    label: "Ví Dụ (Examples)",         tooltip: "Cung cấp ví dụ mẫu để AI học theo" },
];

// ── Prompt Templates ──────────────────────────────────────────────────────────
const PROMPT_TEMPLATES: {
  id: string;
  name: string;
  icon: string;
  desc: string;
  blocks: Omit<PromptBlock, "id">[];
}[] = [
  {
    id: "math-tutor",
    name: "Gia sư Toán",
    icon: "📐",
    desc: "Hướng dẫn giải bài, dẫn dắt tư duy",
    blocks: [
      { type: "role",        content: "Bạn là gia sư Toán THPT chuyên ôn thi đại học, kiên nhẫn và khuyến khích học sinh tự tư duy.", enabled: true },
      { type: "context",     content: "Học sinh lớp 12 đang ôn thi THPT Quốc Gia, cần giải thích từng bước rõ ràng.", enabled: true },
      { type: "task",        content: "Hướng dẫn giải bài toán {{chủ_đề}} dưới đây, giải thích từng bước.", enabled: true },
      { type: "input",       content: "Bài toán: {{nội_dung_bài_toán}}", enabled: true },
      { type: "constraints", content: "Không giải thẳng đáp án — chỉ hỏi câu dẫn dắt để học sinh tự suy nghĩ. Trả lời bằng tiếng Việt.", enabled: true },
      { type: "output",      content: "Trả lời theo từng bước đánh số. Mỗi bước có giải thích ngắn. Cuối có phần tóm tắt.", enabled: true },
    ],
  },
  {
    id: "code-writer",
    name: "Viết Code",
    icon: "💻",
    desc: "Viết và giải thích code theo yêu cầu",
    blocks: [
      { type: "role",        content: "Bạn là lập trình viên senior với 10 năm kinh nghiệm, viết code sạch và có comment rõ ràng.", enabled: true },
      { type: "task",        content: "Viết code {{ngôn_ngữ}} để {{yêu_cầu_cụ_thể}}.", enabled: true },
      { type: "input",       content: "Thông tin bổ sung: {{thông_tin_thêm}}", enabled: true },
      { type: "constraints", content: "Code phải có comment giải thích từng phần quan trọng. Không dùng thư viện ngoài trừ khi được yêu cầu.", enabled: true },
      { type: "output",      content: "Trả code trong code block có syntax highlight. Sau code là phần giải thích logic từng hàm.", enabled: true },
    ],
  },
  {
    id: "email-writer",
    name: "Viết Email",
    icon: "📧",
    desc: "Soạn email chuyên nghiệp, lịch sự",
    blocks: [
      { type: "role",        content: "Bạn là chuyên gia viết email chuyên nghiệp, lịch sự và thuyết phục.", enabled: true },
      { type: "context",     content: "{{bối_cảnh_gửi_email}}", enabled: true },
      { type: "task",        content: "Viết một email {{loại_email}} gửi đến {{người_nhận}}.", enabled: true },
      { type: "constraints", content: "Giọng văn lịch sự, chuyên nghiệp. Không dài quá 200 từ. Có tiêu đề email phù hợp.", enabled: true },
      { type: "output",      content: "Trả về: Tiêu đề email, phần thân đầy đủ gồm lời chào, nội dung chính và lời kết.", enabled: true },
    ],
  },
  {
    id: "text-analysis",
    name: "Phân tích Văn",
    icon: "📝",
    desc: "Phân tích đoạn văn, thơ, tác phẩm",
    blocks: [
      { type: "role",        content: "Bạn là giáo viên Văn THPT với chuyên môn phân tích văn học sâu sắc.", enabled: true },
      { type: "task",        content: "Phân tích {{khía_cạnh}} của đoạn văn/thơ dưới đây.", enabled: true },
      { type: "input",       content: "Đoạn văn/thơ cần phân tích:\n{{nội_dung}}", enabled: true },
      { type: "constraints", content: "Trả lời bằng tiếng Việt chuẩn. Tập trung vào khía cạnh được yêu cầu, không lan man.", enabled: true },
      { type: "output",      content: "Phân tích theo cấu trúc: 1) Giới thiệu  2) Phân tích chi tiết  3) Nhận xét tổng quát. Mỗi phần 2–4 câu.", enabled: true },
    ],
  },
];

// ── Components ────────────────────────────────────────────────────────────────
export const BlockLibrary = () => {
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const { loadTemplate, blocks } = usePromptStore();

  const handleLoadTemplate = (tpl: typeof PROMPT_TEMPLATES[number]) => {
    if (blocks.length > 0 && !window.confirm("Tải mẫu này sẽ xóa canvas hiện tại. Tiếp tục?")) return;
    loadTemplate(tpl.blocks);
  };

  return (
    <div className="w-64 bg-white border-r border-zinc-200 p-4 h-full flex flex-col z-10 relative">
      <div className="mb-4">
        <h2 className="text-base font-bold text-zinc-800 flex items-center gap-2">
          <span>📚</span> Thư Viện Blocks
        </h2>
        <p className="text-xs text-zinc-500 mt-1">Kéo thả các khối sang bên phải để xây dựng Prompt.</p>
      </div>

      {/* Block items */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {blockTemplates.map(template => (
          <DraggableLibraryItem key={template.type} template={template} />
        ))}

        {/* Template Library section */}
        <div className="pt-2 border-t border-zinc-100 mt-2">
          <button
            onClick={() => setTemplatesOpen(v => !v)}
            className="w-full flex items-center justify-between text-xs font-semibold text-zinc-600 hover:text-violet-600 py-1.5 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <span>📦</span> Bộ Mẫu Sẵn
            </span>
            {templatesOpen
              ? <ChevronDown className="w-3.5 h-3.5" />
              : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {templatesOpen && (
            <div className="mt-1.5 space-y-1.5">
              {PROMPT_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => handleLoadTemplate(tpl)}
                  className="w-full text-left p-2.5 rounded-xl border border-zinc-200 hover:border-violet-300 hover:bg-violet-50 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-base">{tpl.icon}</span>
                    <span className="text-xs font-semibold text-zinc-700 group-hover:text-violet-700">
                      {tpl.name}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 group-hover:text-violet-500 leading-tight pl-6">
                    {tpl.desc}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tip */}
      <div className="mt-4 pt-4 border-t border-zinc-100">
        <div className="bg-violet-50 p-3 rounded-xl border border-violet-100">
          <h4 className="text-xs font-semibold text-violet-800 mb-1">💡 Mẹo nhỏ</h4>
          <p className="text-xs text-violet-600 leading-relaxed">
            Một Prompt chất lượng thường nên có ít nhất <b>Vai trò</b> và <b>Nhiệm vụ</b> rõ ràng.
          </p>
        </div>
      </div>
    </div>
  );
};

const DraggableLibraryItem = ({
  template,
}: {
  template: { type: BlockType; label: string; tooltip: string };
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:   `template-${template.type}`,
    data: { type: template.type, isTemplate: true },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 999 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      title={template.tooltip}
      className={`relative p-3 bg-white border border-zinc-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-violet-400 hover:shadow-md transition-all group flex items-center gap-3 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <GripVertical className="text-zinc-300 w-4 h-4 group-hover:text-violet-400 transition-colors" />
      <span className="font-medium text-zinc-700 text-sm group-hover:text-violet-700 transition-colors">
        {template.label}
      </span>
      <div className="absolute left-full ml-2 w-48 p-2 bg-zinc-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
        {template.tooltip}
        <div className="absolute top-1/2 -left-1 -mt-1 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-zinc-800" />
      </div>
    </div>
  );
};
