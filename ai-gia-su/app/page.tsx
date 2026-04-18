import ChatForm from "@/components/ChatForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-6 shadow-lg shadow-indigo-200">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            AI Gia Sư Cá Nhân Hóa
          </h1>
          <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed">
            Đặt câu hỏi bất kỳ — AI sẽ giải thích theo cách phù hợp nhất với bạn
          </p>
        </div>

        {/* Chat */}
        <ChatForm />

        {/* Feature Pills */}
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          {[
            { icon: "✦", label: "Giải thích rõ ràng" },
            { icon: "⚡", label: "Phản hồi tức thì" },
            { icon: "📚", label: "Mọi môn học" },
          ].map(({ icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 bg-white border border-slate-100 px-3.5 py-1.5 rounded-full shadow-sm"
            >
              <span>{icon}</span>
              {label}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
