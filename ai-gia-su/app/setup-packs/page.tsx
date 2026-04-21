"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Settings2, ArrowRight, Copy } from "lucide-react";
import type { SetupPack } from "@/lib/setupPacks";
import Navbar from "@/components/Navbar";

const SUBJECT_COLORS: Record<string, string> = {
  "Toán":    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  "Văn":     "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400",
  "Lý":      "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400",
  "Hóa":     "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  "Anh":     "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  "default": "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function PackCard({ pack }: { pack: SetupPack }) {
  const color = SUBJECT_COLORS[pack.subject_tag] ?? SUBJECT_COLORS.default;
  return (
    <div className="surface rounded-2xl shadow-sm card-hover flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${color}`}>
          {pack.subject_tag}
        </span>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{pack.level_tag}</span>
      </div>
      <div>
        <h3 className="font-display font-semibold text-zinc-900 dark:text-zinc-50 text-sm leading-snug">{pack.title}</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">{pack.subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {pack.chips.slice(0, 3).map((chip) => (
          <span key={chip} className="text-[10px] px-2 py-0.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-full text-zinc-500 dark:text-zinc-400">
            {chip}
          </span>
        ))}
      </div>
      <div className="flex gap-2 mt-auto pt-1">
        <Link
          href={`/setup-packs/${pack.slug}`}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 hover:opacity-90 text-white font-medium transition-all shadow-sm shadow-violet-200 dark:shadow-violet-900/30"
        >
          Bắt đầu <ArrowRight className="w-3 h-3" />
        </Link>
        <Link
          href={`/setup-packs/${pack.slug}#prompt`}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all"
        >
          <Copy className="w-3 h-3" />
          Copy prompt
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="surface rounded-2xl p-5 h-52 animate-pulse">
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-16" />
        <div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-10" />
      </div>
      <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full w-3/4 mb-2" />
      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full w-full mb-1" />
      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full w-4/5 mb-4" />
      <div className="flex gap-2">
        <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex-1" />
        <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex-1" />
      </div>
    </div>
  );
}

export default function SetupPacksPage() {
  const [packs,   setPacks]   = useState<SetupPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/setup-packs")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPacks(data);
        else setError(data.error ?? "Lỗi tải dữ liệu.");
      })
      .catch(() => setError("Lỗi kết nối."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-200 dark:shadow-violet-900/40">
            <Settings2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Biến AI thành <span className="gradient-text">gia sư riêng</span> của bạn
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            Mỗi Setup Pack giúp bạn cấu hình AI đúng cách cho từng môn học. Setup một lần, dùng mãi mãi.
          </p>
          {!loading && packs.length > 0 && (
            <span className="inline-block mt-3 text-xs px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900 font-medium">
              {packs.length} pack có sẵn
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{error}</p>
          </div>
        ) : packs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Chưa có Setup Pack nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {packs.map((p) => <PackCard key={p.slug} pack={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}
