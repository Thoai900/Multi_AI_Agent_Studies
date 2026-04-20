"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import type { PackDetail, Platform, SetupStep } from "@/lib/setupPacks";

// ── System Prompt inline copy (for show_prompt steps) ────────────────────────
function PromptCopyBox({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 my-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-indigo-700">System Prompt — copy và dán vào đây</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(prompt).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            });
          }}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all
            ${copied
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
        >
          {copied ? "✓ Đã copy!" : "Copy System Prompt"}
        </button>
      </div>
      <pre className="text-xs text-indigo-900 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed font-mono scrollbar-thin">
        {prompt}
      </pre>
    </div>
  );
}

// ── Main wizard step page ─────────────────────────────────────────────────────
export default function WizardStepPage() {
  const params   = useParams<{ slug: string; n: string }>();
  const router   = useRouter();
  const slug     = params.slug;
  const stepNum  = parseInt(params.n, 10);

  const [pack,     setPack]     = useState<PackDetail | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [platform, setPlatform] = useState<Platform>("claude");

  // Fetch pack + read platform from URL
  useEffect(() => {
    const urlP = new URLSearchParams(window.location.search).get("p") as Platform | null;
    const saved = localStorage.getItem(`setup_${slug}_platform`) as Platform | null;
    setPlatform(urlP ?? saved ?? "claude");

    fetch(`/api/setup-packs/${slug}`)
      .then((r) => r.json())
      .then((data) => { if (!data.error) setPack(data); })
      .finally(() => setLoading(false));
  }, [slug]);

  const steps      = pack?.steps[platform] ?? [];
  const totalSteps = steps.length;
  const step       = steps.find((s) => s.step_order === stepNum) ?? null;
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

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Not found ──
  if (!pack || !step) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center px-4">
        <div>
          <p className="text-gray-500 mb-3">Không tìm thấy bước này.</p>
          <Link href={`/setup-packs/${slug}`} className="text-indigo-600 text-sm hover:underline">
            ← Quay lại pack
          </Link>
        </div>
      </div>
    );
  }

  const platformLabel = { claude: "Claude", gemini: "Gemini", chatgpt: "ChatGPT Free" }[platform];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <Link
            href={`/setup-packs/${slug}`}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 truncate max-w-[140px]"
          >
            ← {pack.title}
          </Link>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((s) => (
              <div
                key={s.step_order}
                className={`rounded-full transition-all duration-200 ${
                  s.step_order === stepNum
                    ? "w-4 h-2 bg-indigo-600"
                    : s.step_order < stepNum
                    ? "w-2 h-2 bg-indigo-300"
                    : "w-2 h-2 bg-gray-200"
                }`}
              />
            ))}
          </div>

          <span className="text-xs text-gray-400 flex-shrink-0">{stepNum} / {totalSteps}</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Platform badge */}
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 mb-6 inline-block">
          {platformLabel}
        </span>

        {/* Step number + title */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Bước {stepNum}
          </p>
          <h2 className="text-2xl font-semibold text-gray-900 leading-tight mb-3">{step.title}</h2>
          {step.subtitle && (
            <p className="text-sm text-gray-500 leading-relaxed">{step.subtitle}</p>
          )}
        </div>

        {/* Detail instructions */}
        {step.detail && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{step.detail}</p>
          </div>
        )}

        {/* System prompt copy box */}
        {step.show_prompt && pack.system_prompt && (
          <PromptCopyBox prompt={pack.system_prompt} />
        )}

        {/* Tip */}
        {step.tip && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
            <p className="text-xs font-semibold text-amber-700 mb-1">💡 Mẹo</p>
            <p className="text-sm text-amber-800 leading-relaxed">{step.tip}</p>
          </div>
        )}
      </main>

      {/* Navigation footer */}
      <footer className="bg-white border-t border-gray-100 px-4 py-4 sticky bottom-0">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className="flex-1 text-sm py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50
              disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium"
          >
            ← Bước trước
          </button>
          <button
            onClick={handleNext}
            className="flex-1 text-sm py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
          >
            {isLast ? "Hoàn tất ✓" : "Bước tiếp theo →"}
          </button>
        </div>
      </footer>
    </div>
  );
}
