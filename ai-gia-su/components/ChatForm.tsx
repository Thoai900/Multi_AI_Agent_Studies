"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  model?: string;
};

type ModelId = "gemini-2.5-pro" | "gemini-2.5-flash";

const MODELS: { id: ModelId; label: string; badge: string }[] = [
  { id: "gemini-2.5-flash", label: "2.5 Flash", badge: "Nhanh" },
  { id: "gemini-2.5-pro",   label: "2.5 Pro",   badge: "Mạnh"  },
];

const SUGGESTIONS = [
  "Giải thích định lý Pythagoras",
  "Học Calculus bắt đầu từ đâu?",
  "Xác suất cổ điển là gì?",
  "Cách giải phương trình bậc 2",
];

let _id = 0;
const uid = () => String(++_id);

// ── Icons ──────────────────────────────────────────────────────────────────────
const BotIcon = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const SpinIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ── Main component ─────────────────────────────────────────────────────────────
export default function ChatForm() {
  const [input, setInput]               = useState("");
  const [messages, setMessages]         = useState<Message[]>([]);
  const [loading, setLoading]           = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>("gemini-2.5-flash");

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef    = useRef<AbortController | null>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-fill from URL param (?prompt=...) when navigating from Prompt Library
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const promptParam = params.get("prompt");
    if (!promptParam) return;
    const decoded = decodeURIComponent(promptParam);
    setInput(decoded);
    window.history.replaceState({}, "", "/");
    setTimeout(() => {
      textareaRef.current?.focus();
      autoResize();
    }, 50);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const sendMessage = useCallback(async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const userMsg: Message = { id: uid(), role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    const assistantId = uid();

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${apiBase}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          model: selectedModel,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "Lỗi kết nối tới server.");
      }

      // Insert streaming placeholder
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", streaming: true },
      ]);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let parsed: { text?: string; done?: boolean; model?: string; error?: string };
          try { parsed = JSON.parse(raw); } catch { continue; }

          if (parsed.error) throw new Error(parsed.error);

          if (parsed.text) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + parsed.text }
                  : m
              )
            );
          }

          if (parsed.done) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, streaming: false, model: parsed.model }
                  : m
              )
            );
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;

      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra.";
      setMessages((prev) => {
        const hasPlaceholder = prev.some((m) => m.id === assistantId);
        if (hasPlaceholder) {
          return prev.map((m) =>
            m.id === assistantId ? { ...m, content: msg, streaming: false } : m
          );
        }
        return [...prev, { id: assistantId, role: "assistant", content: msg }];
      });
    } finally {
      // Ensure streaming flag is cleared even on unexpected exit
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
      );
      setLoading(false);
    }
  }, [input, messages, loading, selectedModel]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Model selector ──────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-2">
        <span className="text-xs text-gray-400 mr-1">Model</span>
        {MODELS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedModel(m.id)}
            disabled={loading}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              ${selectedModel === m.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {m.label} · {m.badge}
          </button>
        ))}
      </div>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
              <BotIcon />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">Hỏi bất cứ điều gì</h2>
            <p className="text-sm text-gray-400 mb-8">AI gia sư sẵn sàng giải đáp 24/7</p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-sm text-gray-600 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-gray-200 rounded-xl px-4 py-3 transition-all duration-150"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* Bot avatar */}
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mt-0.5 shadow-sm">
                    <BotIcon />
                  </div>
                )}

                {/* Bubble */}
                <div className="max-w-[82%] space-y-1">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words
                      ${msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : "bg-gray-100 text-gray-800 rounded-tl-sm"
                      }`}
                  >
                    {msg.content || (msg.streaming && (
                      <span className="flex gap-1 items-center h-5">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </span>
                    ))}

                    {/* Blinking cursor while streaming */}
                    {msg.streaming && msg.content && (
                      <span className="inline-block w-[2px] h-[1em] bg-gray-500 ml-0.5 align-text-bottom animate-cursor" />
                    )}
                  </div>

                  {/* Model badge */}
                  {msg.role === "assistant" && !msg.streaming && msg.model && (
                    <p className="text-[10px] text-gray-300 px-1">{msg.model}</p>
                  )}
                </div>

                {/* User avatar */}
                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                    <UserIcon />
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input ───────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-end bg-gray-50 rounded-2xl border border-gray-200
            focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100
            transition-all duration-200 px-4 py-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi… (Enter để gửi)"
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 text-sm
                resize-none outline-none leading-relaxed disabled:opacity-50"
              style={{ maxHeight: "160px" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700
                active:bg-indigo-800 disabled:bg-gray-200 text-white disabled:text-gray-400
                flex items-center justify-center transition-all duration-150"
            >
              {loading ? <SpinIcon /> : <SendIcon />}
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">Shift + Enter để xuống dòng</p>
        </div>
      </div>
    </div>
  );
}
