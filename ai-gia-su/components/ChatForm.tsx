"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Send, Loader2, User } from "lucide-react";

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
  { icon: "📐", text: "Giải thích định lý Pythagoras" },
  { icon: "∫",  text: "Học Calculus bắt đầu từ đâu?" },
  { icon: "🎲", text: "Xác suất cổ điển là gì?" },
  { icon: "📊", text: "Cách giải phương trình bậc 2" },
];

let _id = 0;
const uid = () => String(++_id);

export default function ChatForm({ initialMessage = "" }: { initialMessage?: string }) {
  const [input, setInput]                 = useState("");
  const [messages, setMessages]           = useState<Message[]>([]);
  const [loading, setLoading]             = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>("gemini-2.5-flash");

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const didAutoSend = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  // Auto-send the message passed from the landing page
  useEffect(() => {
    if (!initialMessage || didAutoSend.current) return;
    didAutoSend.current = true;
    // Small delay so the chat UI has mounted before sending
    const t = setTimeout(() => sendMessage(initialMessage), 80);
    return () => clearTimeout(t);
  }, [initialMessage]); // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* Model selector */}
      <div className="flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm px-4 py-2.5 flex items-center gap-2">
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mr-1">Model</span>
        {MODELS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedModel(m.id)}
            disabled={loading}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
              ${selectedModel === m.id
                ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-sm shadow-violet-200 dark:shadow-violet-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
          >
            {m.label} · {m.badge}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4 py-12 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center mb-5 shadow-lg shadow-violet-200 dark:shadow-violet-900/40">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold gradient-text mb-2">Xin chào! 👋</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">AI gia sư sẵn sàng giải đáp mọi thắc mắc 24/7</p>
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => sendMessage(s.text)}
                  className="text-left text-sm text-zinc-600 dark:text-zinc-300 surface rounded-2xl px-4 py-3 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all duration-150 card-hover"
                >
                  <span className="mr-1.5">{s.icon}</span>
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-slide-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* Bot avatar */}
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center mt-0.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                {/* Bubble */}
                <div className="max-w-[82%] space-y-1">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words
                      ${msg.role === "user"
                        ? "bg-gradient-to-br from-violet-600 to-purple-500 text-white rounded-tr-sm shadow-sm shadow-violet-200 dark:shadow-violet-900/30"
                        : "bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-tl-sm shadow-sm"
                      }`}
                  >
                    {msg.content || (msg.streaming && (
                      <span className="flex gap-1 items-center h-5">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </span>
                    ))}
                    {msg.streaming && msg.content && (
                      <span className="inline-block w-[2px] h-[1em] bg-zinc-400 ml-0.5 align-text-bottom animate-cursor" />
                    )}
                  </div>

                  {/* Model badge */}
                  {msg.role === "assistant" && !msg.streaming && msg.model && (
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-600 px-1">{msg.model}</p>
                  )}
                </div>

                {/* User avatar */}
                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mt-0.5">
                    <User className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-end bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm focus-within:border-violet-400 dark:focus-within:border-violet-600 focus-within:ring-2 focus-within:ring-violet-500/15 transition-all duration-200 px-4 py-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi… (Enter để gửi)"
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 text-sm resize-none outline-none leading-relaxed disabled:opacity-50 font-sans"
              style={{ maxHeight: "160px" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 hover:opacity-90 active:opacity-80 disabled:opacity-30 text-white flex items-center justify-center transition-all duration-150 shadow-sm hover:shadow-md hover:shadow-violet-200 dark:hover:shadow-violet-900/40 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center mt-2">Shift + Enter để xuống dòng</p>
        </div>
      </div>
    </div>
  );
}
