"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ModelId = "gemini-2.5-pro" | "gemini-2.5-flash";

const MODELS: { id: ModelId; label: string; badge: string; description: string }[] = [
  {
    id: "gemini-2.5-flash",
    label: "2.5 Flash",
    badge: "Nhanh",
    description: "Phản hồi nhanh, tiết kiệm quota",
  },
  {
    id: "gemini-2.5-pro",
    label: "2.5 Pro",
    badge: "Mạnh",
    description: "Suy luận sâu, phức tạp hơn",
  },
];

export default function ChatForm() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>("gemini-2.5-flash");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${apiBase}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history: messages, model: selectedModel }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "API error");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.";
      setMessages((prev) => [...prev, { role: "assistant", content: message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const activeModel = MODELS.find((m) => m.id === selectedModel)!;

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      {/* Model Selector */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <p className="text-xs text-slate-400 mb-2.5 font-medium uppercase tracking-wide">
          Chọn model
        </p>
        <div className="flex gap-2">
          {MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedModel(m.id)}
              disabled={loading}
              className={`flex-1 flex flex-col items-start gap-0.5 px-3.5 py-2.5 rounded-xl border text-left transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedModel === m.id
                  ? "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-semibold ${
                    selectedModel === m.id ? "text-indigo-700" : "text-slate-700"
                  }`}
                >
                  {m.label}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    selectedModel === m.id
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {m.badge}
                </span>
              </div>
              <span className="text-xs text-slate-400">{m.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message History */}
      {messages.length > 0 && (
        <div className="p-5 space-y-3 max-h-[420px] overflow-y-auto scrollbar-thin">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-50 text-slate-700 border border-slate-100"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start items-center gap-2">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5">
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-xs text-slate-400">{activeModel.label}</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex gap-3 items-end bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all duration-200 p-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi của bạn... (Enter để gửi)"
            rows={1}
            disabled={loading}
            className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm resize-none outline-none leading-relaxed disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-200 disabled:cursor-not-allowed text-white disabled:text-slate-400 font-medium text-sm px-5 py-2.5 rounded-xl transition-all duration-150 select-none"
          >
            {loading ? "Đang hỏi..." : "Hỏi AI"}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Shift + Enter để xuống dòng
        </p>
      </form>
    </div>
  );
}
