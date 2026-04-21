import Navbar from "@/components/Navbar";
import ChatForm from "@/components/ChatForm";

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        <ChatForm />
      </main>
    </div>
  );
}
