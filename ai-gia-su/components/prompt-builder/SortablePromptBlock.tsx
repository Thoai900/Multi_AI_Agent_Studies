"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ChevronDown } from "lucide-react";
import { usePromptStore, type PromptBlock, type BlockType } from "@/lib/store/promptBuilderStore";

// ── Per-block metadata ────────────────────────────────────────────────────────
const blockMeta: Record<
  BlockType,
  { label: string; emoji: string; badge: string; placeholder: string; templates: string[] }
> = {
  role: {
    label: "Vai Trò",
    emoji: "👤",
    badge: "bg-violet-100 text-violet-700 border-violet-200",
    placeholder:
      "VD: Bạn là gia sư Toán THPT chuyên ôn thi đại học, kiên nhẫn và khuyến khích học sinh tự tư duy.",
    templates: [
      "Bạn là gia sư Toán THPT chuyên ôn thi đại học, kiên nhẫn và khuyến khích học sinh tự tư duy.",
      "Bạn là chuyên gia marketing với 10 năm kinh nghiệm, giỏi viết nội dung thuyết phục cho giới trẻ Việt.",
      "Bạn là giáo viên tiếng Anh giao tiếp, dạy theo phương pháp phản xạ, không dịch sang tiếng Việt.",
    ],
  },
  context: {
    label: "Bối Cảnh",
    emoji: "📋",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    placeholder:
      "VD: Học sinh lớp 12 đang ôn thi THPT Quốc Gia, học lực trung bình, cần giải thích đơn giản.",
    templates: [
      "Học sinh lớp 12 đang ôn thi THPT Quốc Gia, học lực trung bình, cần giải thích thật đơn giản.",
      "Tôi đang viết báo cáo thực tập, cần trình bày chuyên nghiệp nhưng không quá kỹ thuật.",
      "Người dùng là người mới bắt đầu kinh doanh online, chưa có kinh nghiệm marketing.",
    ],
  },
  task: {
    label: "Nhiệm Vụ",
    emoji: "🎯",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    placeholder:
      "VD: Giải thích khái niệm {{chủ_đề}} trong Giải tích theo cách đơn giản nhất cho người mới học.",
    templates: [
      "Giải thích khái niệm {{chủ_đề}} theo cách đơn giản nhất, dùng ví dụ từ cuộc sống hàng ngày.",
      "Viết một đoạn mô tả sản phẩm hấp dẫn cho {{tên_sản_phẩm}}, nhắm đến đối tượng {{đối_tượng}}, dưới 150 từ.",
      "Lập kế hoạch học tập chi tiết cho 30 ngày để đạt mục tiêu {{mục_tiêu}}, chia nhỏ thành từng ngày.",
    ],
  },
  input: {
    label: "Đầu Vào",
    emoji: "📥",
    badge: "bg-green-100 text-green-700 border-green-200",
    placeholder: "VD: Bài toán hoặc văn bản người dùng cung cấp: {{nội_dung}}",
    templates: [
      "Bài toán người dùng cung cấp: {{nội_dung_bài_toán}}",
      "Đoạn văn cần phân tích: {{nội_dung_đoạn_văn}}",
      "Thông tin sản phẩm: Tên: {{tên}} | Giá: {{giá}} | Đặc điểm: {{đặc_điểm}}",
    ],
  },
  constraints: {
    label: "Giới Hạn",
    emoji: "🚫",
    badge: "bg-red-100 text-red-700 border-red-200",
    placeholder:
      "VD: Không giải thẳng đáp án. Trả lời bằng tiếng Việt. Tối đa 300 từ. Không dùng thuật ngữ chuyên môn.",
    templates: [
      "Không giải thẳng đáp án — chỉ hỏi câu dẫn dắt để học sinh tự suy nghĩ.",
      "Trả lời bằng tiếng Việt. Tối đa 300 từ. Không dùng thuật ngữ chuyên môn khó hiểu.",
      "Chỉ sử dụng kiến thức trong phạm vi chương trình lớp 12. Không bịa số liệu.",
    ],
  },
  output: {
    label: "Đầu Ra",
    emoji: "📤",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    placeholder:
      "VD: Trả lời theo từng bước đánh số. Mỗi bước có giải thích ngắn. Cuối cùng có phần tóm tắt.",
    templates: [
      "Trả lời theo từng bước đánh số. Mỗi bước có giải thích ngắn. Cuối cùng có phần tóm tắt 2-3 câu.",
      "Dùng bảng gồm 3 cột: Khái niệm | Ví dụ | Ghi chú. Mỗi hàng một điểm.",
      "Dùng bullet point ngắn gọn, mỗi dòng dưới 20 từ. Bắt đầu mỗi dòng bằng động từ hành động.",
    ],
  },
  examples: {
    label: "Ví Dụ",
    emoji: "💡",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    placeholder:
      "VD:\nInput: Giải thích đạo hàm\nOutput mong muốn: Đạo hàm là tốc độ thay đổi...",
    templates: [
      "Input mẫu: {{câu_hỏi_ví_dụ}}\nOutput mong muốn: {{câu_trả_lời_mẫu}}",
      "Ví dụ đúng: {{ví_dụ_đúng}}\nVí dụ sai (cần tránh): {{ví_dụ_sai}}",
      "Format mẫu:\n1. Tiêu đề ngắn\n2. Giải thích 2-3 câu\n3. Ví dụ thực tế\n4. Kết luận",
    ],
  },
};

// ── Component ─────────────────────────────────────────────────────────────────
export const SortablePromptBlock = ({ block }: { block: PromptBlock }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id:   block.id,
    data: { type: block.type, isCanvasArea: true },
  });

  const updateBlock = usePromptStore(s => s.updateBlock);
  const toggleBlock = usePromptStore(s => s.toggleBlock);
  const removeBlock = usePromptStore(s => s.removeBlock);

  const [showTemplates, setShowTemplates] = useState(false);
  const meta = blockMeta[block.type];

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
  };

  const applyTemplate = (tpl: string) => {
    updateBlock(block.id, tpl);
    setShowTemplates(false);
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
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
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
          className="w-full p-3 text-sm text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 resize-none transition-all placeholder:text-zinc-400 leading-relaxed"
          value={block.content}
          onChange={e => updateBlock(block.id, e.target.value)}
          rows={3}
          placeholder={meta.placeholder}
          disabled={!block.enabled}
        />
      </div>

      {/* Click outside to close templates */}
      {showTemplates && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
};
