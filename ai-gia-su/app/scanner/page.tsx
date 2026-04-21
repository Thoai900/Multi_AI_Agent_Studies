"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, ImageIcon, Loader2, ScanText, Sparkles,
  ArrowRight, RotateCcw, Copy, Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";

type ScanResult = {
  extractedText: string;
  exerciseType: string;
  suggestedPrompt: string;
};

type DragState = "idle" | "over";

export default function ScannerPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [imageFile,  setImageFile]  = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning,   setScanning]   = useState(false);
  const [result,     setResult]     = useState<ScanResult | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [drag,       setDrag]       = useState<DragState>("idle");
  const [copied,     setCopied]     = useState(false);

  const loadImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh (JPG, PNG, WEBP…)");
      return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImage(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag("idle");
    const file = e.dataTransfer.files?.[0];
    if (file) loadImage(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag("over");
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]); // strip "data:image/...;base64,"
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleScan = async () => {
    if (!imageFile) return;
    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const imageBase64 = await toBase64(imageFile);
      const res = await fetch("/api/scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType: imageFile.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lỗi không xác định.");
      setResult(data as ScanResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi kết nối.");
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUsePrompt = () => {
    if (!result) return;
    router.push(`/?prompt=${encodeURIComponent(result.suggestedPrompt)}`);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.suggestedPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200 dark:shadow-violet-900/40">
            <ScanText className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Scanner <span className="gradient-text">Bài Tập</span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Chụp ảnh đề bài, AI sẽ đọc nội dung và đề xuất cách giải ngay lập tức
          </p>
        </div>

        {/* Upload zone */}
        {!previewUrl ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setDrag("idle")}
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 animate-fade-in
              ${drag === "over"
                ? "border-violet-400 bg-violet-50 dark:bg-violet-950/20 scale-[1.01]"
                : "border-zinc-300 dark:border-zinc-700 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-950/10"
              }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
            </div>
            <p className="font-display font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Kéo thả ảnh vào đây
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-4">hoặc nhấn để chọn từ thiết bị</p>
            <span className="inline-block text-xs px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              JPG · PNG · WEBP · HEIC
            </span>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {/* Preview */}
            <div className="surface rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <ImageIcon className="w-4 h-4" />
                  <span className="font-medium truncate max-w-xs">{imageFile?.name}</span>
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Đổi ảnh
                </button>
              </div>
              <div className="p-4 flex justify-center bg-zinc-50 dark:bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-80 max-w-full object-contain rounded-xl"
                />
              </div>
            </div>

            {/* Scan button */}
            {!result && (
              <button
                onClick={handleScan}
                disabled={scanning}
                className="w-full btn-primary justify-center py-3 rounded-2xl text-sm"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang phân tích ảnh…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Phân tích bài tập
                  </>
                )}
              </button>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
                ⚠️ {error}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-6 space-y-4 animate-slide-up">
            {/* Exercise type badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-sm shadow-violet-200 dark:shadow-violet-900/30">
                {result.exerciseType}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">Phát hiện tự động bởi AI</span>
            </div>

            {/* Extracted text */}
            <section className="surface rounded-2xl shadow-sm p-5">
              <h3 className="font-display font-semibold text-zinc-900 dark:text-zinc-50 text-sm mb-3 flex items-center gap-2">
                <ScanText className="w-4 h-4 text-violet-500" />
                Nội dung trích xuất
              </h3>
              <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3 border border-zinc-100 dark:border-zinc-700/50">
                <pre className="text-xs text-zinc-700 dark:text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
                  {result.extractedText}
                </pre>
              </div>
            </section>

            {/* Suggested prompt */}
            <section className="surface rounded-2xl shadow-sm p-5">
              <h3 className="font-display font-semibold text-zinc-900 dark:text-zinc-50 text-sm mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                Prompt đề xuất
              </h3>
              <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl p-4 border border-violet-100 dark:border-violet-900 mb-4">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {result.suggestedPrompt}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="btn-ghost flex-1 justify-center">
                  {copied ? (
                    <><Check className="w-3.5 h-3.5 text-emerald-500" /> Đã sao chép</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Sao chép</>
                  )}
                </button>
                <button onClick={handleUsePrompt} className="btn-primary flex-1 justify-center">
                  Gửi cho AI <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>

            {/* Scan another */}
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 text-sm py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Quét ảnh khác
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
