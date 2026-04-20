"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import type { PackDetail, Platform, SetupStep, CheatItem } from "@/lib/setupPacks";
import { PLATFORMS } from "@/lib/setupPacks";

// ── System Prompt Box ─────────────────────────────────────────────────────────
function SystemPromptBox({ prompt, slug }: { prompt: string; slug: string }) {
  const [copied,   setCopied]   = useState(false);
  const [expanded, setExpanded] = useState(false);
  const wordCount = prompt.trim().split(/\s+/).length;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([prompt], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `system-prompt-${slug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="prompt" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">System Prompt</h3>
        <span className="text-[11px] text-gray-400">
          {wordCount} từ · ~{Math.round(prompt.length / 4).toLocaleString()} tokens
        </span>
      </div>

      <div className={`bg-gray-50 rounded-xl p-3 mb-3 overflow-y-auto transition-all duration-200 ${expanded ? "" : "max-h-36"}`}>
        <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-mono">{prompt}</pre>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleCopy}
          className={`text-xs px-4 py-2 rounded-xl font-medium transition-all
            ${copied
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200"
            }`}
        >
          {copied ? "✓ Đã copy — dán vào Project instructions" : "Copy System Prompt đầy đủ"}
        </button>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-xs px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
        >
          {expanded ? "Thu gọn ↑" : "Mở rộng xem hết ↓"}
        </button>
        <button
          onClick={handleDownload}
          className="text-xs px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
        >
          Tải .txt ↓
        </button>
      </div>
    </section>
  );
}

// ── Cheat Sheet ───────────────────────────────────────────────────────────────
function CheatSheet({ items }: { items: CheatItem[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, command: string) => {
    navigator.clipboard.writeText(command).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  return (
    <section>
      <h3 className="font-semibold text-gray-900 text-sm mb-3">Cheat sheet — câu lệnh nhanh</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-2.5">
            <span className="text-xs text-gray-500 w-44 flex-shrink-0 leading-snug">{item.label}</span>
            <code className="text-xs text-gray-700 font-mono flex-1 min-w-0 truncate">{item.command}</code>
            <button
              onClick={() => handleCopy(item.id, item.command)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border flex-shrink-0 transition-all
                ${copiedId === item.id
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
            >
              {copiedId === item.id ? "✓" : "Copy"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Checklist ─────────────────────────────────────────────────────────────────
function Checklist({
  steps,
  completedSteps,
  onToggle,
  platformWarning,
}: {
  steps: SetupStep[];
  completedSteps: Set<number>;
  onToggle: (order: number) => void;
  platformWarning?: string;
}) {
  return (
    <div>
      {platformWarning && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-3 text-xs text-amber-800 leading-relaxed">
          {platformWarning}
        </div>
      )}
      <div className="space-y-0.5">
        {steps.map((step) => {
          const done = completedSteps.has(step.step_order);
          return (
            <div
              key={step.id}
              onClick={() => onToggle(step.step_order)}
              className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors select-none"
            >
              <div className={`w-[18px] h-[18px] rounded-[4px] border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all
                ${done ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"}`}
              >
                {done && <span className="text-white text-[10px] font-bold">✓</span>}
              </div>
              <div>
                <p className={`text-sm font-medium leading-snug ${done ? "line-through text-gray-400" : "text-gray-900"}`}>
                  {step.title}
                </p>
                {step.subtitle && (
                  <p className={`text-xs mt-0.5 leading-relaxed ${done ? "text-gray-300" : "text-gray-500"}`}>
                    {step.subtitle}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SetupPackPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug   = params.slug;

  const [pack,           setPack]           = useState<PackDetail | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [platform,       setPlatform]       = useState<Platform>("claude");
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Fetch pack data
  useEffect(() => {
    fetch(`/api/setup-packs/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setPack(data);
      })
      .catch(() => setError("Lỗi kết nối."))
      .finally(() => setLoading(false));
  }, [slug]);

  // Restore platform + progress from localStorage
  useEffect(() => {
    const urlP = new URLSearchParams(window.location.search).get("p") as Platform | null;
    const saved = localStorage.getItem(`setup_${slug}_platform`) as Platform | null;
    const active = urlP ?? saved ?? "claude";
    setPlatform(active);

    const done = JSON.parse(localStorage.getItem(`setup_${slug}_${active}_done`) ?? "[]") as number[];
    setCompletedSteps(new Set(done));
  }, [slug]);

  const handlePlatformChange = useCallback((p: Platform) => {
    setPlatform(p);
    localStorage.setItem(`setup_${slug}_platform`, p);
    const done = JSON.parse(localStorage.getItem(`setup_${slug}_${p}_done`) ?? "[]") as number[];
    setCompletedSteps(new Set(done));
  }, [slug]);

  const handleToggleStep = useCallback((order: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.has(order) ? next.delete(order) : next.add(order);
      localStorage.setItem(`setup_${slug}_${platform}_done`, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [slug, platform]);

  const handleStart = () => {
    router.push(`/setup-packs/${slug}/step/1?p=${platform}`);
  };

  const handleScrollToPrompt = () => {
    document.getElementById("prompt")?.scrollIntoView({ behavior: "smooth" });
  };

  // Derived
  const currentSteps    = pack?.steps[platform] ?? [];
  const totalSteps      = currentSteps.length;
  const doneCount       = completedSteps.size;
  const progressPct     = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;
  const platformWarning = pack?.platform_warnings?.[platform];
  const platformLabel   = PLATFORMS.find((p) => p.id === platform)?.label ?? platform;

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Error ──
  if (error || !pack) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-3">{error ?? "Không tìm thấy pack này."}</p>
          <Link href="/setup-packs" className="text-indigo-600 text-sm hover:underline">
            ← Xem tất cả packs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/setup-packs" className="text-gray-400 hover:text-gray-600 text-sm flex-shrink-0 transition-colors">
              ← Packs
            </Link>
            <span className="text-gray-200">|</span>
            <span className="text-xs text-gray-500 truncate">
              {pack.level_tag} · {pack.subject_tag}
            </span>
          </div>
          <button
            onClick={handleStart}
            className="flex-shrink-0 text-xs px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors"
          >
            Bắt đầu →
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Hero */}
        <section>
          <p className="text-xs text-gray-400 mb-2">Setup pack · {pack.level_tag} · {pack.subject_tag}</p>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">{pack.title}</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">{pack.subtitle}</p>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {pack.chips.map((chip) => (
              <span key={chip} className="text-[11px] px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-500">
                {chip}
              </span>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleStart}
              className="text-sm px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-indigo-200"
            >
              Bắt đầu setup theo bước
            </button>
            <button
              onClick={handleScrollToPrompt}
              className="text-sm px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Tôi chỉ cần system prompt
            </button>
          </div>
        </section>

        {/* Progress */}
        {totalSteps > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-500">Tiến độ của bạn (tự lưu)</span>
              <span className="text-xs font-semibold text-gray-900">{doneCount} / {totalSteps} bước</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400">Thoát ra rồi quay lại là tiếp tục đúng chỗ đang dở.</p>
          </section>
        )}

        {/* Platform selector */}
        <section>
          <p className="text-xs text-gray-500 mb-2.5">Bạn đang dùng AI nào? (hướng dẫn sẽ đổi theo)</p>
          <div className="flex gap-2 flex-wrap">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePlatformChange(p.id)}
                className={`text-xs px-4 py-2 rounded-xl border font-medium transition-all
                  ${platform === p.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {/* Checklist */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Setup {platformLabel}</h3>
          {currentSteps.length > 0 ? (
            <>
              <Checklist
                steps={currentSteps}
                completedSteps={completedSteps}
                onToggle={handleToggleStep}
                platformWarning={platformWarning}
              />
              <button
                onClick={handleStart}
                className="mt-4 w-full text-xs py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium transition-colors"
              >
                Làm theo từng bước có hướng dẫn chi tiết →
              </button>
            </>
          ) : (
            <p className="text-xs text-gray-400">Không có bước nào cho nền tảng này.</p>
          )}
        </section>

        {/* System Prompt */}
        <SystemPromptBox prompt={pack.system_prompt} slug={slug} />

        {/* Cheat Sheet */}
        {pack.cheat_items.length > 0 && <CheatSheet items={pack.cheat_items} />}
      </main>
    </div>
  );
}
