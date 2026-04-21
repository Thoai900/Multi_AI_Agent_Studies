"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import HomeLanding from "@/components/HomeLanding";
import ChatForm from "@/components/ChatForm";

export default function Home() {
  const [chatStarted,     setChatStarted]     = useState(false);
  const [initialMessage,  setInitialMessage]  = useState("");

  const handleStartChat = (message = "") => {
    setInitialMessage(message);
    setChatStarted(true);
  };

  return (
    <div className={`flex flex-col bg-zinc-50 dark:bg-zinc-950 ${chatStarted ? "h-screen" : "min-h-screen"}`}>
      <Navbar />

      {chatStarted ? (
        <main className="flex-1 overflow-hidden">
          <ChatForm initialMessage={initialMessage} />
        </main>
      ) : (
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <HomeLanding onStartChat={handleStartChat} />
        </main>
      )}
    </div>
  );
}
