"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { aiChatLimits, type ChatMessage } from "@/lib/ai-chat";

/** A plain text chat: the conversation lives in this component only and is gone on reload. */
export function AiChat({ configured }: { configured: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pending]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || pending || !configured) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setDraft("");
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/ai/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next.slice(-aiChatLimits.history) }) });
      const data = (await response.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (!response.ok || !data.reply) throw new Error(data.error ?? "پاسخی دریافت نشد.");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "پاسخی دریافت نشد.");
    } finally {
      setPending(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }

  return (
    <div className="card flex h-[calc(100dvh-14rem)] min-h-96 flex-col !p-0">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm leading-7" aria-live="polite">
        {messages.length === 0 && <p className="m-0 text-slate-500">{configured ? "پیامی بنویسید تا گفتگو شروع شود." : "هوش مصنوعی هنوز تنظیم نشده است."}</p>}
        {messages.map((message, index) => (
          <div key={index}>
            <p className="m-0 mb-1 text-xs text-slate-400">{message.role === "user" ? "شما" : "هوش مصنوعی"}</p>
            <p className="m-0 whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
        {pending && <p className="m-0 flex items-center gap-2 text-slate-500"><Loader2 size={14} className="animate-spin" aria-hidden />در حال نوشتن</p>}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="border-t border-slate-100 p-3">
        <div className="flex items-end gap-2">
          <textarea
            aria-label="پیام"
            rows={2}
            value={draft}
            maxLength={aiChatLimits.message}
            disabled={!configured}
            aria-invalid={error ? true : undefined}
            aria-describedby="ai-chat-msg"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            className="input flex-1 resize-none"
          />
          <button type="submit" disabled={pending || !configured || !draft.trim()} className="btn btn-primary">
            {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Send size={16} className="-scale-x-100" aria-hidden />}
            ارسال
          </button>
        </div>
        <p id="ai-chat-msg" className={`mt-1.5 min-h-5 text-xs ${error ? "text-red-600" : "text-slate-500"}`}>{error}</p>
      </form>
    </div>
  );
}
