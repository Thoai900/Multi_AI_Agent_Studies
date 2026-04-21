"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Copy, Check, ArrowLeft, ArrowRight } from "lucide-react";
import type { PackDetail, Platform, SetupStep } from "@/lib/setupPacks";
import Navbar from "@/components/Navbar";

// ── Prompt Copy Box ───────────────────────────────────────────────────────────
function PromptCopyBox({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900 rounded-2xl p-4 my-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">System Prompt — copy và dán vào đây</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(prompt).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            });
          }}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all
            ${copied
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
              : "bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-sm"
            }`}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Đã copy!" : "Copy Prompt"}
        </button>
      </div>
      <pre className="text-xs text-violet-900 dark:text-violet-300 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed font-mono scrollbar-thin">
        {prompt}
      </pre>
    </div>
  );
}

// ── Wizard Step Page ──────────────────────────────────────────────────────────
export default function WizardStepPage() {
  const params   = useParams<{ slug: string; n: string }>();
  const router   = useRouter();
  const slug     = params.slug;
  const stepNum  = parseInt(params.n, 10);

  const [pack,     setPack]     = useState<PackDetail | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [platform, setPlatform] = useState<Platform>("claude");

  useEffect(() => {
    const urlP  = new URLSearchParams(window.location.search).get("p") as Platform | null;
    const saved = localStorage.getItem(`setup_${slug}_platform`) as Platform | null;
    setPlatform(urlP ?? saved ?? "claude");

    fetch(`/api/setup-packs/${slug}`)
      .then((r) => r.json())
      .then((data) => { if (!data.error) setPack(data); })
      .finally(() => setLoading(false));
  }, [slug]);

  const steps      = pack?.steps[platform] ?? [];
  const totalSteps = steps.length;
  const step       = steps.find((s: SetupStep) => s.step_order === stepNum) ?? null;
  const isFirst    = stepNum === 1;
  const isLast     = stepNum === totalSteps;

  const markDone = () => {
    const key  = `setup_${slug}_${platform}_done`;
    const done = JSON.parse(localStorage.getItem(key) ?? "[]") as number[];
    if (!done.includes(stepNum)) {
      localStorage.setItem(key, JSON.stringify([...done, stepNum]));
    }
  };

  const handleNext = () => {
    markDone();
    if (isLast) {
      router.push(`/setup-packs/${slug}?p=${platform}`);
    } else {
      router.push(`/setup-packs/${slug}/step/${stepNum + 1}?p=${platform}`);
    }
  };

  const handlePrev = () => {
    router.push(`/setup-packs/${slug}/step/${stepNum - 1}?p=${platform}`);
  };

  const platformLabel = { claude: "Claude", gemini: "Gemini", chatgpt: "ChatGPT Free" }[platform];

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

  if (!pack || !step) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <div className="flex items-center justify-center py-32 text-center px-4">
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 mb-3">Không tìm thấy bước này.</p>
            <Link href={`/setup-packs/${slug}`} className="text-violet-600 dark:text-violet-400 text-sm hover:underline">
              ← Quay lại pack
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* Wizard header with progress dots */}
      <header className="glass border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <Link
            href={`/setup-packs/${slug}`}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors flex-shrink-0 truncate max-w-[140px]"
          >
            <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{pack.title}</span>
          </Link>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((s: SetupStep) => (
              <div
                key={s.step_order}
                className={`rounded-full transition-all duration-300 ${
                  s.step_order === stepNum
                    ? "w-5 h-2 bg-gradient-to-r from-violet-600 to-purple-500"
                    : s.step_order < stepNum
                    ? "w-2 h-2 bg-violet-300 dark:bg-violet-700"
                    : "w-2 h-2 bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            ))}
          </div>

          <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">{stepNum} / {totalSteps}</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 pb-28 animate-fade-in">
        {/* Platform badge */}
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-900 mb-6 inline-block">
          {platformLabel}
        </span>

        {/* Step number + title */}
        <div className="mb-6">
          <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
            <span className="gradient-text">Bước {stepNum}</span>
          </p>
          <h2 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight mb-3">{step.title}</h2>
          {step.subtitle && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{step.subtitle}</p>
          )}
        </div>

        {/* Detail instructions */}
        {step.detail && (
          <div className="surface rounded-2xl shadow-sm p-5 mb-4">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{step.detail}</p>
          </div>
        )}

        {/* System prompt copy box */}
        {step.show_prompt && pack.system_prompt && (
          <PromptCopyBox prompt={pack.system_prompt} />
        )}

        {/* Tip */}
        {step.tip && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-4">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">💡 Mẹo</p>
            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{step.tip}</p>
          </div>
        )}
      </main>

      {/* Navigation footer */}
      <footer className="glass border-t border-zinc-200 dark:border-zinc-800 px-4 py-4 sticky bottom-0 z-40">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className="flex-1 flex items-center justify-center gap-2 text-sm py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Bước trước
          </button>
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 text-sm py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 hover:opacity-90 text-white font-medium transition-all shadow-sm shadow-violet-200 dark:shadow-violet-900/30"
          >
            {isLast ? "Hoàn tất ✓" : "Bước tiếp theo"}
            {!isLast && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </footer>
    </div>
  );
}
