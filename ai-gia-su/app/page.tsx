import Link from "next/link";
import ChatForm from "@/components/ChatForm";

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 leading-tight">AI Gia Sư Cá Nhân Hóa</h1>
              <p className="text-xs text-gray-400">Powered by Gemini · Giải đáp 24/7</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/prompts"
              className="flex-shrink-0 text-xs px-3.5 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-medium"
            >
              📚 Thư Viện
            </Link>
            <Link
              href="/setup-packs"
              className="flex-shrink-0 text-xs px-3.5 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-medium"
            >
              ⚙️ Setup Packs
            </Link>
          </div>
        </div>
      </header>

      {/* Chat — takes all remaining height */}
      <main className="flex-1 overflow-hidden">
        <ChatForm />
      </main>
    </div>
  );
}
