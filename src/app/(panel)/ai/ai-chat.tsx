"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Check, Loader2, Plus, Send, Wrench, X } from "lucide-react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage, PendingCall } from "@/lib/ai-chat-types";

type Decisions = Record<string, "approve" | "reject">;

/** ChatGPT-style rendering of the model's markdown; raw HTML is not enabled, so model text cannot inject markup. */
const markdown: Components = {
  p: (props) => <p className="my-2 first:mt-0 last:mb-0" {...props} />,
  h1: (props) => <h3 className="mb-2 mt-4 text-base font-bold first:mt-0" {...props} />,
  h2: (props) => <h3 className="mb-2 mt-4 text-base font-bold first:mt-0" {...props} />,
  h3: (props) => <h4 className="mb-1.5 mt-3 text-sm font-bold first:mt-0" {...props} />,
  h4: (props) => <h4 className="mb-1.5 mt-3 text-sm font-bold first:mt-0" {...props} />,
  ul: (props) => <ul className="my-2 list-disc space-y-1 ps-6" {...props} />,
  ol: (props) => <ol className="my-2 list-decimal space-y-1 ps-6" {...props} />,
  li: (props) => <li className="ps-1" {...props} />,
  strong: (props) => <strong className="font-bold" {...props} />,
  a: (props) => <a className="text-brand underline" target="_blank" rel="noreferrer noopener" {...props} />,
  hr: () => <hr className="my-3 border-slate-300" />,
  blockquote: (props) => <blockquote className="my-2 border-s-4 border-slate-300 ps-3 text-slate-600" {...props} />,
  pre: (props) => <pre dir="ltr" className="my-2 overflow-x-auto rounded-lg bg-slate-800 p-3 text-xs leading-6 text-slate-100" {...props} />,
  code: ({ className, ...props }) => <code className={className ? "font-mono" : "rounded bg-slate-200 px-1 py-0.5 font-mono text-[0.85em]"} {...props} />,
  table: (props) => <div className="my-2 overflow-x-auto rounded-lg border border-slate-300"><table className="w-full border-collapse text-start text-xs" {...props} /></div>,
  th: (props) => <th className="border-b border-slate-300 bg-slate-200 px-3 py-2 text-start font-bold" {...props} />,
  td: (props) => <td className="border-b border-slate-200 px-3 py-2" {...props} />,
};

const toolLabel = (name: string) => name.replaceAll("_", " ");

/** What the owner sees for a message: user text, assistant text, and one chip per tool call. Tool results stay hidden. */
function Bubble({ message }: { message: ChatMessage }) {
  if (message.role === "tool") return null;
  if (message.role === "user") {
    return (
      <div className="flex justify-start">
        <div dir="auto" className="w-fit max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-ss-sm bg-brand px-4 py-2.5 text-sm leading-7 text-white shadow-sm">{message.content}</div>
      </div>
    );
  }
  const text = message.content?.trim();
  if (!text && !message.tool_calls?.length) return null;
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-brand" aria-hidden><Bot size={18} /></span>
      <div className="min-w-0 max-w-[85%] space-y-2">
        {text && <div dir="auto" className="min-w-0 break-words rounded-2xl rounded-ss-sm bg-slate-100 px-4 py-3 text-sm leading-7 text-slate-800"><Markdown remarkPlugins={[remarkGfm]} components={markdown}>{text}</Markdown></div>}
        {message.tool_calls && (
          <div className="flex flex-wrap gap-1.5">
            {message.tool_calls.map((call) => (
              <span key={call.id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500"><Wrench size={12} aria-hidden />{toolLabel(call.function.name)}</span>
            ))}
          </div>
        )}
      </div>
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

  const [loaded, setLoaded] = useState(false);

  // The conversation is saved on the server, so it survives reloads and shows on every device.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/conversation", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((saved) => {
        if (cancelled || !saved) return;
        setMessages((current) => (current.length ? current : saved.messages));
        setPending((current) => (current.length ? current : saved.pending));
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      fetch("/api/ai/conversation", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages, pending }) }).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [loaded, messages, pending]);

  function reset() {
    setMessages([]);
    setPending([]);
    setDecisions({});
    setError(null);
  }

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
    return <div className="card text-sm text-slate-600">دستیار خاموش است. مقدار <code dir="ltr">AI_API_KEY</code> را در تنظیمات محیط پنل بگذارید و دوباره اجرا کنید.</div>;
  }

  return (
    <div className="card flex h-[calc(100vh-14rem)] min-h-[28rem] flex-col gap-3 !p-0">
      {messages.length > 0 && (
        <div className="flex justify-end border-b border-slate-200 px-3 py-2">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={reset}><Plus size={16} aria-hidden />گفتگوی جدید</button>
        </div>
      )}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
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
