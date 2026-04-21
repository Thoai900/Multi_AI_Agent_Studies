"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Copy, Check, Download, ChevronDown, ArrowRight } from "lucide-react";
import type { PackDetail, Platform, SetupStep, CheatItem } from "@/lib/setupPacks";
import { PLATFORMS } from "@/lib/setupPacks";
import Navbar from "@/components/Navbar";

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
    <section id="prompt" className="surface rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-zinc-900 dark:text-zinc-50 text-sm">System Prompt</h3>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
          {wordCount} từ · ~{Math.round(prompt.length / 4).toLocaleString()} tokens
        </span>
      </div>

      <div className={`bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3 mb-3 overflow-y-auto transition-all duration-200 ${expanded ? "" : "max-h-36"}`}>
        <pre className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed font-mono">{prompt}</pre>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl font-medium transition-all
            ${copied
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
              : "btn-primary"
            }`}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Đã copy — dán vào Project instructions" : "Copy System Prompt"}
        </button>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
        >
          {expanded ? "Thu gọn" : "Xem đầy đủ"}
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
        >
          <Download className="w-3 h-3" />
          Tải .txt
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
      <h3 className="font-display font-semibold text-zinc-900 dark:text-zinc-50 text-sm mb-3">Cheat sheet — câu lệnh nhanh</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 surface rounded-xl px-4 py-2.5">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-44 flex-shrink-0 leading-snug">{item.label}</span>
            <code className="text-xs text-zinc-700 dark:text-zinc-300 font-mono flex-1 min-w-0 truncate">{item.command}</code>
            <button
              onClick={() => handleCopy(item.id, item.command)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border flex-shrink-0 transition-all
                ${copiedId === item.id
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                }`}
            >
              {copiedId === item.id ? <Check className="w-3 h-3" /> : "Copy"}
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
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-3 text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
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
              className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors select-none"
            >
              <div className={`w-[18px] h-[18px] rounded-[4px] border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all
                ${done
                  ? "bg-gradient-to-br from-violet-600 to-purple-500 border-transparent"
                  : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"
                }`}
              >
                {done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
              </div>
              <div>
                <p className={`text-sm font-medium leading-snug ${done ? "line-through text-zinc-400 dark:text-zinc-600" : "text-zinc-900 dark:text-zinc-50"}`}>
                  {step.title}
                </p>
                {step.subtitle && (
                  <p className={`text-xs mt-0.5 leading-relaxed ${done ? "text-zinc-300 dark:text-zinc-700" : "text-zinc-500 dark:text-zinc-400"}`}>
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

  const currentSteps    = pack?.steps[platform] ?? [];
  const totalSteps      = currentSteps.length;
  const doneCount       = completedSteps.size;
  const progressPct     = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;
  const platformWarning = pack?.platform_warnings?.[platform];
  const platformLabel   = PLATFORMS.find((p) => p.id === platform)?.label ?? platform;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <p className="text-zinc-500 dark:text-zinc-400 mb-3">{error ?? "Không tìm thấy pack này."}</p>
            <Link href="/setup-packs" className="text-violet-600 dark:text-violet-400 text-sm hover:underline">
              ← Xem tất cả packs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
        {/* Hero */}
        <section>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">
            Setup pack · {pack.level_tag} · {pack.subject_tag}
          </p>
          <h1 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{pack.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">{pack.subtitle}</p>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {pack.chips.map((chip) => (
              <span key={chip} className="text-[11px] px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-full text-zinc-500 dark:text-zinc-400">
                {chip}
              </span>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleStart} className="btn-primary">
              Bắt đầu setup theo bước <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleScrollToPrompt} className="btn-ghost">
              Tôi chỉ cần system prompt
            </button>
          </div>
        </section>

        {/* Progress */}
        {totalSteps > 0 && (
          <section className="surface rounded-2xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Tiến độ của bạn (tự lưu)</span>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">{doneCount} / {totalSteps} bước</span>
            </div>
            <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-600">Thoát ra rồi quay lại là tiếp tục đúng chỗ đang dở.</p>
          </section>
        )}

        {/* Platform selector */}
        <section>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">Bạn đang dùng AI nào? (hướng dẫn sẽ đổi theo)</p>
          <div className="flex rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden w-fit">
            {PLATFORMS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => handlePlatformChange(p.id)}
                className={`text-xs px-4 py-2 font-medium transition-all
                  ${i > 0 ? "border-l border-zinc-200 dark:border-zinc-700" : ""}
                  ${platform === p.id
                    ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {/* Checklist */}
        <section className="surface rounded-2xl shadow-sm p-5">
          <h3 className="font-display font-semibold text-zinc-900 dark:text-zinc-50 text-sm mb-3">Setup {platformLabel}</h3>
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
                className="mt-4 w-full text-xs py-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-950/50 text-violet-700 dark:text-violet-400 font-medium transition-colors border border-violet-100 dark:border-violet-900"
              >
                Làm theo từng bước có hướng dẫn chi tiết →
              </button>
            </>
          ) : (
            <p className="text-xs text-zinc-400 dark:text-zinc-600">Không có bước nào cho nền tảng này.</p>
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
