import type { BlockType } from "@/lib/store/promptBuilderStore";

export const blockMeta: Record<
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
