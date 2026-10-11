"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Send, Wrench, X } from "lucide-react";
import type { ChatMessage, PendingCall } from "@/lib/ai-chat-types";

type Decisions = Record<string, "approve" | "reject">;

const toolLabel = (name: string) => name.replaceAll("_", " ");

/** Text the owner sees for a message: user text, assistant text, and one chip per tool call. */
function Bubble({ message }: { message: ChatMessage }) {
  if (typeof message.content === "string") {
    return message.role === "user" ? <div className="ms-auto max-w-[85%] whitespace-pre-wrap rounded-2xl bg-brand px-4 py-2.5 text-sm text-white">{message.content}</div> : <div className="max-w-[85%] whitespace-pre-wrap text-sm">{message.content}</div>;
  }
  const blocks = message.content;
  if (message.role === "user") return null; // tool results are shown through the assistant's follow-up
  return (
    <div className="max-w-[85%] space-y-2">
      {blocks.map((block, index) =>
        block.type === "text" && typeof block.text === "string" && block.text.trim() ? (
          <div key={index} className="whitespace-pre-wrap text-sm">{block.text}</div>
        ) : block.type === "tool_use" ? (
          <span key={index} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"><Wrench size={12} aria-hidden />{toolLabel(String(block.name))}</span>
        ) : null,
      )}
    </div>
  );
}

export function AiChat({ enabled }: { enabled: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<PendingCall[]>([]);
  const [decisions, setDecisions] = useState<Decisions>({});
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pending, busy]);

  async function send(history: ChatMessage[], nextDecisions: Decisions) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: history, decisions: nextDecisions }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "خطا در ارتباط با دستیار.");
      setMessages(data.messages);
      setPending(data.pending);
      setDecisions({});
      if (data.notice) setError(data.notice);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در ارتباط با دستیار.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = text.trim();
    if (!value || busy || pending.length > 0) return;
    setText("");
    const history = [...messages, { role: "user" as const, content: value }];
    setMessages(history);
    void send(history, {});
  }

  function decide(id: string, decision: "approve" | "reject") {
    const next = { ...decisions, [id]: decision };
    setDecisions(next);
    // Continue once every card has an answer.
    if (pending.every((call) => next[call.id])) {
      setPending([]);
      void send(messages, next);
    }
  }

  if (!enabled) {
    return <div className="card text-sm text-slate-600">دستیار خاموش است. مقدار <code dir="ltr">ANTHROPIC_API_KEY</code> را در تنظیمات محیط پنل بگذارید و دوباره اجرا کنید.</div>;
  }

  return (
    <div className="card flex h-[calc(100vh-14rem)] min-h-[28rem] flex-col gap-3 !p-0">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && <p className="m-0 text-sm text-slate-500">مثلاً: «خلاصهٔ وضعیت را بگو» یا «درخواست‌های خرید در انتظار را نشان بده».</p>}
        {messages.map((message, index) => <Bubble key={index} message={message} />)}

        {pending.map((call) => (
          <div key={call.id} className="max-w-[85%] rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
            <p className="m-0 font-bold">{call.label}</p>
            <pre dir="ltr" className="m-0 mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-2 text-xs">{JSON.stringify(call.input, null, 2)}</pre>
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => decide(call.id, "approve")}><Check size={16} aria-hidden />تأیید و اجرا</button>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => decide(call.id, "reject")}><X size={16} aria-hidden />رد</button>
            </div>
          </div>
        ))}

        {busy && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" aria-hidden />در حال پاسخ…</div>}
        {error && <p role="alert" className="m-0 text-sm text-red-600">{error}</p>}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 p-3">
        <input className="input flex-1" value={text} onChange={(event) => setText(event.target.value)} maxLength={4000} placeholder={pending.length ? "اول کارت‌های بالا را تأیید یا رد کنید" : "پیام…"} disabled={busy || pending.length > 0} aria-label="پیام" />
        <button type="submit" className="btn btn-primary" disabled={busy || pending.length > 0 || !text.trim()}><Send size={16} aria-hidden />ارسال</button>
      </form>
    </div>
  );
}
