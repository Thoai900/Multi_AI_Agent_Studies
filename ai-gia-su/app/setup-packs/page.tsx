"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { SetupPack } from "@/lib/setupPacks";

const SUBJECT_COLORS: Record<string, string> = {
  "Toán":    "bg-blue-100 text-blue-700",
  "Văn":     "bg-pink-100 text-pink-700",
  "Lý":      "bg-purple-100 text-purple-700",
  "Hóa":     "bg-emerald-100 text-emerald-700",
  "Anh":     "bg-amber-100 text-amber-700",
  "default": "bg-gray-100 text-gray-600",
};

function PackCard({ pack }: { pack: SetupPack }) {
  const color = SUBJECT_COLORS[pack.subject_tag] ?? SUBJECT_COLORS.default;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${color}`}>
          {pack.subject_tag}
        </span>
        <span className="text-[11px] text-gray-400">{pack.level_tag}</span>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{pack.title}</h3>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{pack.subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {pack.chips.slice(0, 3).map((chip) => (
          <span key={chip} className="text-[10px] px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-full text-gray-500">
            {chip}
          </span>
        ))}
      </div>
      <div className="flex gap-2 mt-auto pt-1">
        <Link
          href={`/setup-packs/${pack.slug}`}
          className="flex-1 text-xs py-2 text-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
        >
          Bắt đầu →
        </Link>
        <Link
          href={`/setup-packs/${pack.slug}#prompt`}
          className="flex-1 text-xs py-2 text-center rounded-xl border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
        >
          Copy prompt
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 h-52 animate-pulse">
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-gray-100 rounded-full w-16" />
        <div className="h-5 bg-gray-100 rounded-full w-10" />
      </div>
      <div className="h-4 bg-gray-100 rounded-full w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded-full w-full mb-1" />
      <div className="h-3 bg-gray-100 rounded-full w-4/5 mb-4" />
      <div className="flex gap-2">
        <div className="h-8 bg-gray-100 rounded-xl flex-1" />
        <div className="h-8 bg-gray-100 rounded-xl flex-1" />
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
            ← Chat
          </Link>
          <span className="text-gray-200">|</span>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Setup Packs</h1>
            <p className="text-xs text-gray-400">
              Thiết lập AI cá nhân hóa · {loading ? "…" : `${packs.length} pack`}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Biến AI thành gia sư riêng của bạn</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Mỗi Setup Pack giúp bạn cấu hình AI đúng cách cho từng môn học. Setup một lần, dùng mãi mãi.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-sm font-medium text-gray-500">{error}</p>
          </div>
        ) : packs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-sm">Chưa có Setup Pack nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packs.map((p) => <PackCard key={p.slug} pack={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}
