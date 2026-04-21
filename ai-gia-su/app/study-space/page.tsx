"use client";

import { useState } from "react";
import {
  BookOpen, Zap, Loader2, RotateCcw,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";
import Navbar from "@/components/Navbar";

/* ── Types ─────────────────────────────────────────────────────────────────── */
type Flashcard = { front: string; back: string };
type QuizItem  = { question: string; options: string[]; answer: number; explanation: string };
type Mode      = "flashcards" | "quiz";

/* ── Flip Card ──────────────────────────────────────────────────────────────── */
function FlipCard({ card, index, total }: { card: Flashcard; index: number; total: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      {/* Card */}
      <div
        className="w-full max-w-lg cursor-pointer"
        style={{ perspective: "1200px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "220px",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 surface rounded-2xl shadow-sm flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-xs font-semibold text-violet-500 dark:text-violet-400 mb-4 uppercase tracking-widest">
              Thẻ {index + 1} / {total}
            </span>
            <p className="font-display font-bold text-lg text-zinc-800 dark:text-zinc-100 leading-relaxed">
              {card.front}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-6">Nhấn để xem đáp án</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 text-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            }}
          >
            <span className="text-xs font-semibold text-violet-200 mb-4 uppercase tracking-widest">
              Đáp án
            </span>
            <p className="font-display font-semibold text-lg text-white leading-relaxed">
              {card.back}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-600">
        {flipped ? "✓ Đã xem đáp án — nhấn lại để lật thẻ" : "Nhấn vào thẻ để xem mặt sau"}
      </p>
    </div>
  );
}

/* ── Flashcard Deck ─────────────────────────────────────────────────────────── */
function FlashcardDeck({ cards, onReset }: { cards: Flashcard[]; onReset: () => void }) {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(cards.length - 1, i + 1));

  return (
    <div className="space-y-6">
      <FlipCard card={cards[index]} index={index} total={cards.length} />

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`rounded-full transition-all duration-200 ${
              i === index
                ? "w-5 h-2 bg-gradient-to-r from-violet-600 to-purple-500"
                : "w-2 h-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600"
            }`}
          />
        ))}
      </div>

      {/* Nav buttons */}
      <div className="flex gap-3 max-w-lg mx-auto">
        <button
          onClick={prev}
          disabled={index === 0}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> Trước
        </button>
        <button
          onClick={next}
          disabled={index === cards.length - 1}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-500 hover:opacity-90 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm shadow-violet-200 dark:shadow-violet-900/30"
        >
          Tiếp <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={onReset}
        className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Tạo lại bộ thẻ
      </button>
    </div>
  );
}

/* ── Quiz ───────────────────────────────────────────────────────────────────── */
function QuizPlayer({ questions, onReset }: { questions: QuizItem[]; onReset: () => void }) {
  const [answers,   setAnswers]   = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const choose = (qi: number, oi: number) => {
    if (submitted) return;
    setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)));
  };

  const score = submitted
    ? questions.filter((q, i) => answers[i] === q.answer).length
    : 0;

  const allAnswered = answers.every((a) => a !== null);

  return (
    <div className="space-y-5 animate-fade-in">
      {questions.map((q, qi) => {
        const chosen   = answers[qi];
        const isCorrect = chosen === q.answer;

        return (
          <div key={qi} className="surface rounded-2xl shadow-sm p-5">
            <p className="font-display font-semibold text-zinc-900 dark:text-zinc-50 text-sm mb-4">
              <span className="gradient-text mr-2">Câu {qi + 1}.</span>
              {q.question}
            </p>

            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                let optClass =
                  "w-full text-left text-sm px-4 py-3 rounded-xl border transition-all duration-150 ";

                if (!submitted) {
                  optClass +=
                    chosen === oi
                      ? "bg-violet-50 dark:bg-violet-950/40 border-violet-400 dark:border-violet-600 text-violet-700 dark:text-violet-300 font-medium"
                      : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/50 dark:hover:bg-violet-950/20";
                } else {
                  if (oi === q.answer) {
                    optClass +=
                      "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-semibold";
                  } else if (oi === chosen && !isCorrect) {
                    optClass +=
                      "bg-red-50 dark:bg-red-950/30 border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 line-through";
                  } else {
                    optClass +=
                      "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600";
                  }
                }

                return (
                  <button key={oi} onClick={() => choose(qi, oi)} className={optClass}>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Explanation after submit */}
            {submitted && (
              <div className={`mt-4 rounded-xl p-3 flex items-start gap-2.5 ${
                isCorrect
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900"
                  : "bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900"
              }`}>
                {isCorrect
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  : <XCircle     className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                }
                <p className={`text-xs leading-relaxed ${
                  isCorrect
                    ? "text-emerald-800 dark:text-emerald-300"
                    : "text-red-800 dark:text-red-300"
                }`}>
                  {q.explanation}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Submit / Score */}
      {!submitted ? (
        <button
          onClick={() => setSubmitted(true)}
          disabled={!allAnswered}
          className="w-full btn-primary justify-center py-3 rounded-2xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {allAnswered ? "Nộp bài kiểm tra" : `Còn ${answers.filter((a) => a === null).length} câu chưa trả lời`}
        </button>
      ) : (
        <div className="surface rounded-2xl shadow-sm p-6 text-center">
          <div className={`text-4xl font-display font-extrabold mb-2 ${
            score === questions.length
              ? "text-emerald-500"
              : score >= questions.length / 2
              ? "text-amber-500"
              : "text-red-500"
          }`}>
            {score} / {questions.length}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
            {score === questions.length
              ? "🎉 Xuất sắc! Bạn trả lời đúng tất cả!"
              : score >= questions.length / 2
              ? "👍 Khá tốt! Ôn lại phần sai nhé."
              : "💪 Cần cố gắng thêm! Đọc kỹ phần giải thích rồi thử lại."}
          </p>
          <button onClick={onReset} className="btn-ghost mx-auto">
            <RefreshCw className="w-3.5 h-3.5" /> Tạo bộ câu hỏi mới
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function StudySpacePage() {
  const [mode,       setMode]       = useState<Mode>("flashcards");
  const [text,       setText]       = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [quiz,       setQuiz]       = useState<QuizItem[] | null>(null);

  const hasResult = mode === "flashcards" ? !!flashcards : !!quiz;

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setFlashcards(null);
    setQuiz(null);

    try {
      const res = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lỗi không xác định.");

      if (mode === "flashcards") setFlashcards(data.data as Flashcard[]);
      else                       setQuiz(data.data as QuizItem[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFlashcards(null);
    setQuiz(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200 dark:shadow-violet-900/40">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Study <span className="gradient-text">Space</span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Dán nội dung bất kỳ để AI tự tạo flashcard hoặc bộ câu hỏi ôn tập
          </p>
        </div>

        {!hasResult ? (
          <div className="space-y-5 animate-fade-in">
            {/* Mode selector */}
            <div className="flex rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              {(["flashcards", "quiz"] as Mode[]).map((m, i) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all
                    ${i > 0 ? "border-l border-zinc-200 dark:border-zinc-700" : ""}
                    ${mode === m
                      ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white"
                      : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                >
                  {m === "flashcards"
                    ? <><RotateCcw className="w-4 h-4" /> Flashcard</>
                    : <><Zap        className="w-4 h-4" /> Trắc nghiệm</>
                  }
                </button>
              ))}
            </div>

            {/* Text input */}
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                Nội dung cần ôn tập
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  mode === "flashcards"
                    ? "Dán ghi chú, đoạn văn giáo khoa, câu trả lời AI… AI sẽ tạo thẻ ghi nhớ từ nội dung này."
                    : "Dán nội dung bài học… AI sẽ tạo 5 câu hỏi trắc nghiệm để kiểm tra hiểu biết của bạn."
                }
                rows={8}
                className="input-field resize-none leading-relaxed"
              />
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1.5">
                {text.length > 0 && `${text.length} ký tự · `}
                {mode === "flashcards" ? "Sẽ tạo 6–8 thẻ ghi nhớ" : "Sẽ tạo 5 câu hỏi trắc nghiệm"}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
                ⚠️ {error}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!text.trim() || loading}
              className="w-full btn-primary justify-center py-3.5 rounded-2xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI đang tạo nội dung…
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {mode === "flashcards" ? "Tạo bộ Flashcard" : "Tạo bộ Trắc nghiệm"}
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Result header */}
            <div className="flex items-center justify-between animate-fade-in">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-sm shadow-violet-200 dark:shadow-violet-900/30">
                {mode === "flashcards"
                  ? `${flashcards?.length} Flashcard`
                  : `${quiz?.length} Câu hỏi`}
              </span>
              <button
                onClick={() => { handleReset(); }}
                className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Nhập lại nội dung
              </button>
            </div>

            {mode === "flashcards" && flashcards && (
              <FlashcardDeck cards={flashcards} onReset={handleReset} />
            )}
            {mode === "quiz" && quiz && (
              <QuizPlayer questions={quiz} onReset={handleReset} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
