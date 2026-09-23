"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, LoaderCircle, MessageCircle, Send, X } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

export function SiteChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I’m the VNR Scans assistant. Ask me about the site or a series." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading, open]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || loading) return;
    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-8) }),
      });
      const result = await response.json() as { reply?: string; error?: string };
      if (!response.ok || !result.reply) throw new Error(result.error || "The assistant is temporarily unavailable.");
      setMessages((previous) => [...previous, { role: "assistant", content: result.reply! }]);
    } catch (error) {
      setMessages((previous) => [...previous, { role: "assistant", content: error instanceof Error ? error.message : "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-4 z-[80] sm:bottom-6 sm:right-6">
      {open && (
        <section aria-label="VNR Scans AI assistant" className="mb-3 flex h-[min(32rem,calc(100dvh-7rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111318] shadow-2xl shadow-black/50">
          <header className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-orange-500/15 text-orange-300"><Bot size={19} /></span>
              <div><p className="text-sm font-semibold text-white">VNR Scans Assistant</p><p className="text-xs text-white/50">Ask about the site or series</p></div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"><X size={18} /></button>
          </header>
          <div role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <p className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${message.role === "user" ? "rounded-br-md bg-orange-500 text-white" : "rounded-bl-md bg-white/[0.07] text-white/85"}`}>{message.content}</p>
              </div>
            ))}
            {loading && <div className="flex items-center gap-2 text-xs text-white/50"><LoaderCircle className="animate-spin" size={14} />Thinking…</div>}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={sendMessage} className="flex items-end gap-2 border-t border-white/10 p-3">
            <label className="sr-only" htmlFor="site-assistant-message">Message the assistant</label>
            <textarea id="site-assistant-message" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Ask something…" maxLength={1200} rows={1} className="max-h-28 min-h-10 flex-1 resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-orange-400/60" />
            <button type="submit" disabled={!input.trim() || loading} aria-label="Send message" className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-500 text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"><Send size={16} /></button>
          </form>
        </section>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close assistant" : "Open VNR Scans assistant"} aria-expanded={open} className="ml-auto flex h-14 items-center gap-2 rounded-full bg-orange-500 px-4 text-sm font-semibold text-white shadow-lg shadow-orange-950/35 transition hover:-translate-y-0.5 hover:bg-orange-400">
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        <span>{open ? "Close" : "Ask AI"}</span>
      </button>
    </div>
  );
}
