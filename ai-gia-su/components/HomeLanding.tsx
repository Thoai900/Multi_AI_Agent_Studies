"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Sparkles, ArrowRight, BookOpen, Wand2, ScanLine, GraduationCap,
  Calculator, Brain, Languages, PenTool, Send, Zap, Star, ChevronRight,
} from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    icon: Calculator,
    title: "Giải Toán",
    desc: "Từng bước chi tiết, dễ hiểu",
    accent: "blue",
    prompt: "Giải thích định lý Pythagoras theo cách đơn giản nhất, có ví dụ thực tế",
  },
  {
    icon: Brain,
    title: "Học Khái Niệm",
    desc: "Giải thích rõ ràng, có ví dụ",
    accent: "violet",
    prompt: "Giải thích xác suất cổ điển một cách đơn giản cho người mới học",
  },
  {
    icon: Languages,
    title: "Luyện Ngoại Ngữ",
    desc: "Phản xạ ngôn ngữ tự nhiên",
    accent: "emerald",
    prompt: "Giúp tôi luyện nói tiếng Anh về chủ đề du lịch, bắt đầu từ cơ bản",
  },
  {
    icon: PenTool,
    title: "Cải Thiện Văn Viết",
    desc: "Phong cách chuyên nghiệp hơn",
    accent: "amber",
    prompt: "Giúp tôi viết đoạn văn nghị luận về tầm quan trọng của học tập, chuẩn THPT",
  },
] as const;

const ACCENT_CLASSES: Record<string, { card: string; icon: string; dot: string }> = {
  blue:    { card: "border-blue-100 dark:border-blue-900/40 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-blue-100/60 dark:hover:shadow-blue-900/30",    icon: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400",    dot: "bg-blue-500"    },
  violet:  { card: "border-violet-100 dark:border-violet-900/40 hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-violet-100/60 dark:hover:shadow-violet-900/30", icon: "bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400", dot: "bg-violet-500" },
  emerald: { card: "border-emerald-100 dark:border-emerald-900/40 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-emerald-100/60 dark:hover:shadow-emerald-900/30", icon: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  amber:   { card: "border-amber-100 dark:border-amber-900/40 hover:border-amber-200 dark:hover:border-amber-800 hover:shadow-amber-100/60 dark:hover:shadow-amber-900/30",  icon: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400",  dot: "bg-amber-500"  },
};

const FEATURES = [
  {
    icon: BookOpen,
    title: "Thư Viện Prompt",
    desc: "Hàng trăm prompt được tối ưu sẵn cho từng môn học",
    href: "/prompts",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    icon: Wand2,
    title: "Prompt Builder",
    desc: "Kéo thả block để tạo prompt chuyên nghiệp",
    href: "/prompt-builder",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
  },
  {
    icon: ScanLine,
    title: "Scanner",
    desc: "Phân tích bài tập từ ảnh hoặc văn bản tức thì",
    href: "/scanner",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    icon: GraduationCap,
    title: "Study Space",
    desc: "Tạo tài liệu học tập theo chủ đề tuỳ chỉnh",
    href: "/study-space",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
];

const TRENDING = [
  {
    title: "Gia sư Toán THPT",
    category: "Toán học",
    categoryColor: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60",
    desc: "Hướng dẫn giải từng bước, khuyến khích tư duy thay vì đưa đáp án thẳng",
    upvotes: 124,
  },
  {
    title: "Luyện viết IELTS Task 2",
    category: "Ngoại ngữ",
    categoryColor: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60",
    desc: "Cấu trúc bài luận chuẩn band 7.0+, phân tích điểm mạnh điểm yếu",
    upvotes: 98,
  },
  {
    title: "Debug code Python",
    category: "Lập trình",
    categoryColor: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60",
    desc: "Tìm lỗi, giải thích nguyên nhân và đề xuất fix theo từng dòng code",
    upvotes: 87,
  },
];

const CHIPS = ["Giải tích", "Xác suất", "IELTS Writing", "Văn nghị luận", "Lập trình cơ bản"];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onStartChat: (message?: string) => void;
}

export default function HomeLanding({ onStartChat }: Props) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const msg = input.trim();
    if (!msg) return;
    onStartChat(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const scrollToInput = () => {
    textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => textareaRef.current?.focus(), 300);
  };

  return (
    <div className="relative overflow-x-hidden">

      {/* ── Ambient glow layer ──────────────────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Top violet radial */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[600px] opacity-60 dark:opacity-40"
          style={{ background: "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(139,92,246,0.22) 0%, transparent 70%)" }}
        />
        {/* Right indigo accent */}
        <div
          className="absolute top-1/3 -right-40 w-[500px] h-[500px] opacity-50 dark:opacity-25"
          style={{ background: "radial-gradient(ellipse 60% 60% at 100% 50%, rgba(99,102,241,0.15) 0%, transparent 70%)" }}
        />
        {/* Left pink accent */}
        <div
          className="absolute bottom-0 -left-32 w-[400px] h-[400px] opacity-40 dark:opacity-20"
          style={{ background: "radial-gradient(ellipse 60% 60% at 0% 100%, rgba(232,121,249,0.12) 0%, transparent 70%)" }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* HERO                                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="pt-20 pb-14 px-4 text-center">

        {/* Powered-by badge */}
        <div className="inline-flex items-center gap-1.5 mb-7 px-3 py-1.5 rounded-full border border-violet-200/80 dark:border-violet-800/50 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm shadow-sm animate-fade-in">
          <Zap className="w-3 h-3 text-violet-500" />
          <span className="text-xs font-semibold text-violet-700 dark:text-violet-400 tracking-wide">Powered by Gemini 2.5</span>
        </div>

        {/* H1 */}
        <h1 className="font-display font-bold tracking-tight leading-[1.08] text-zinc-900 dark:text-zinc-50 animate-fade-in delay-100">
          <span className="block text-5xl sm:text-6xl lg:text-7xl mb-2">Học thông minh hơn</span>
          <span className="block text-5xl sm:text-6xl lg:text-7xl gradient-text">với AI cá nhân hóa</span>
        </h1>

        {/* Sub */}
        <p className="mt-6 text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed animate-fade-in delay-200">
          Gia sư AI 24/7 — giải toán, luyện văn, học ngoại ngữ.<br className="hidden sm:block" />
          Prompt tối ưu sẵn. Kết quả vượt trội.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8 mb-12 animate-fade-in delay-300">
          <button onClick={scrollToInput} className="btn-primary text-sm px-6 py-2.5 rounded-full">
            <Sparkles className="w-4 h-4" />
            Bắt đầu học ngay
          </button>
          <Link href="/prompts" className="btn-ghost text-sm px-6 py-2.5 rounded-full">
            Khám phá Prompt
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── Chat Input ─────────────────────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto animate-fade-in delay-300">
          <div className="group relative">
            {/* Gradient border ring on focus */}
            <div className="absolute -inset-[1.5px] rounded-2xl bg-gradient-to-r from-violet-500 via-purple-400 to-pink-400 opacity-0 group-focus-within:opacity-100 transition-all duration-300 blur-[0.5px]" />

            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-100/70 dark:shadow-zinc-950/60 group-focus-within:border-transparent transition-colors duration-300">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi bất cứ điều gì… ví dụ: Giải thích đạo hàm theo cách đơn giản nhất"
                rows={2}
                className="w-full px-5 pt-4 pb-2 text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 bg-transparent outline-none resize-none leading-relaxed font-sans"
              />
              <div className="flex items-center justify-between px-4 pb-3.5">
                <p className="text-xs text-zinc-400 dark:text-zinc-600 select-none">Enter để gửi · Shift+Enter xuống dòng</p>
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white text-xs font-semibold disabled:opacity-35 hover:opacity-90 active:scale-95 transition-all shadow-sm shadow-violet-200 dark:shadow-violet-900/40 disabled:cursor-not-allowed"
                >
                  <Send className="w-3 h-3" /> Gửi
                </button>
              </div>
            </div>
          </div>

          {/* Topic chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => onStartChat(`Dạy tôi về ${chip} theo cách dễ hiểu và có ví dụ thực tế`)}
                className="text-xs px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 bg-white/60 dark:bg-zinc-900/60 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all duration-150 backdrop-blur-sm"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* QUICK ACTIONS                                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.12em] mb-4 text-center">Bắt đầu ngay với</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            const cls = ACCENT_CLASSES[action.accent];
            return (
              <button
                key={action.title}
                onClick={() => onStartChat(action.prompt)}
                className={`group relative flex flex-col items-start gap-3.5 p-5 rounded-2xl border bg-white dark:bg-zinc-900 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${cls.card}`}
              >
                {/* Hover top line */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-violet-500 via-purple-400 to-pink-400 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 ${cls.icon}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-0.5">{action.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug">{action.desc}</p>
                </div>
                <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-200 dark:text-zinc-700 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* FEATURE SHOWCASE                                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="border-y border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/60 dark:bg-zinc-900/40 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Section label */}
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-[0.12em] mb-2">Công cụ học tập</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">Mọi thứ bạn cần trong một nền tảng</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Link
                  key={f.title}
                  href={f.href}
                  className="group flex flex-col gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-200 dark:hover:border-violet-800/70 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100/50 dark:hover:shadow-violet-900/20 transition-all duration-200"
                >
                  <span className={`inline-flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 ${f.bg} ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-1 group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">
                      {f.title}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug">{f.desc}</p>
                  </div>
                  <span className="mt-auto flex items-center gap-1 text-xs font-medium text-zinc-400 dark:text-zinc-600 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors">
                    Khám phá <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TRENDING PROMPTS                                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-7">
          <div>
            <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-[0.12em] mb-1">Cộng đồng</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">Prompt được yêu thích nhất</h2>
          </div>
          <Link
            href="/prompts"
            className="hidden sm:flex items-center gap-1.5 text-sm text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TRENDING.map((p, i) => (
            <div
              key={p.title}
              className="group relative flex flex-col gap-3.5 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-200 dark:hover:border-violet-800/70 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100/50 dark:hover:shadow-violet-900/20 transition-all duration-200 overflow-hidden"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Top accent */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-violet-500 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${p.categoryColor}`}>
                  {p.category}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-600 flex-shrink-0">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {p.upvotes}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-1 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors leading-snug">
                  {p.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">{p.desc}</p>
              </div>

              <Link
                href="/prompts"
                className="mt-auto flex items-center gap-1 text-xs font-semibold text-violet-500 hover:text-violet-700 dark:hover:text-violet-400 transition-colors"
              >
                Dùng prompt này <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>

        <div className="flex sm:hidden justify-center mt-5">
          <Link href="/prompts" className="btn-ghost text-sm px-5 py-2 rounded-full">
            Xem tất cả prompt <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* BOTTOM CTA BAND                                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-10 text-center shadow-2xl shadow-violet-200 dark:shadow-violet-900/40">
          {/* Inner glow */}
          <div
            className="absolute inset-0 opacity-30"
            style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.2) 0%, transparent 70%)" }}
          />
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />

          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-5 mx-auto">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">
              Sẵn sàng học thông minh hơn?
            </h2>
            <p className="text-sm text-violet-100/80 mb-8 max-w-md mx-auto">
              Tham gia cùng hàng nghìn học sinh đang học hiệu quả hơn với AI Gia Sư.
            </p>
            <button
              onClick={scrollToInput}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white text-violet-700 font-semibold text-sm hover:bg-violet-50 active:scale-95 transition-all shadow-lg shadow-violet-900/20"
            >
              <Sparkles className="w-4 h-4" /> Bắt đầu miễn phí
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer hint ─────────────────────────────────────────────────────── */}
      <p className="text-center text-xs text-zinc-400 dark:text-zinc-700 pb-10">
        AI Gia Sư · Học thông minh, không giới hạn
      </p>
    </div>
  );
}
