"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { ArrowRight, ArrowUp, Check, Copy, Loader2, Menu, PanelRightClose, Plus, Sparkles, Trash2, X } from "lucide-react";
import { conversationTitle, type ChatMessage, type PendingCall } from "@/lib/ai-chat-types";
import { BrandLoader } from "@/components/brand-loader";
import { ConfirmForm } from "@/components/confirm-form";
import { Logo } from "@/components/logo";
import { MarkdownText } from "./markdown";
import { ToolCards } from "./tool-cards";

type Decisions = Record<string, "approve" | "reject">;
type ChatResult = { messages: ChatMessage[]; pending: PendingCall[]; notice?: string };
type Summary = { id: string; title: string; updatedAt: string };

const ACCENT = "bg-brand hover:bg-brand-dark";
const SUGGESTIONS = ["خلاصهٔ وضعیت پنل را بگو", "درخواست‌های خرید در انتظار را نشان بده", "تیکت‌های باز را مرور کن"];

/** 7 ثانیه, then 1:05 once it passes a minute. */
function formatElapsed(seconds: number) {
  if (seconds < 60) return `${seconds.toLocaleString("fa-IR")} ثانیه`;
  return `${Math.floor(seconds / 60).toLocaleString("fa-IR")}:${String(seconds % 60).padStart(2, "0")}`.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}
const idFromPath = (path: string) => path.match(/^\/ai\/([A-Za-z0-9-]{4,64})\/?$/)?.[1] ?? null;
const newId = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");

function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-start">
      <div dir="auto" className="w-fit max-w-[75%] whitespace-pre-wrap break-words rounded-2xl bg-[#e6e8f3] px-4 py-3 text-[15px] leading-7">{text}</div>
    </div>
  );
}

function AssistantMessage({ message }: { message: Extract<ChatMessage, { role: "assistant" }> }) {
  const [copied, setCopied] = useState(false);
  const text = message.content?.trim();
  if (!text) return null;
  return (
    <div className="group flex items-start gap-3">
      <Sparkles size={20} className="mt-1 shrink-0 text-brand" aria-hidden />
      <div className="min-w-0 flex-1">
        {text && (
          <div dir="auto" className="break-words text-[15px] leading-8">
            <MarkdownText>{text}</MarkdownText>
          </div>
        )}
        {text && (
          <button
            type="button"
            aria-label="کپی پاسخ"
            title="کپی"
            className="mt-1 rounded-md p-1.5 text-[#7a8196] opacity-0 transition hover:bg-[#e6e8f3] hover:text-[#1f2330] focus:opacity-100 group-hover:opacity-100"
            onClick={() => {
              void navigator.clipboard?.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
          >
            {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
          </button>
        )}
      </div>
    </div>
  );
}

function Composer({ text, setText, onSubmit, disabled, busy, placeholder, inputRef }: { text: string; setText: (value: string) => void; onSubmit: () => void; disabled: boolean; busy: boolean; placeholder: string; inputRef: RefObject<HTMLTextAreaElement | null> }) {
  const canSend = !disabled && !busy && text.trim().length > 0;
  function grow(element: HTMLTextAreaElement) {
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 220)}px`;
  }
  return (
    <form
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        if (canSend) onSubmit();
      }}
      className="rounded-3xl border border-[#d4d8e2] bg-white p-2 shadow-[0_2px_14px_rgba(31,35,48,0.07)] transition focus-within:border-[#b6bcd4] focus-within:shadow-[0_4px_20px_rgba(31,35,48,0.10)]"
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          // An empty box is right-to-left so the placeholder sits on the right; typed text picks its own direction.
          dir={text ? "auto" : "rtl"}
          rows={1}
          value={text}
          maxLength={4000}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="پیام"
          className="block max-h-[220px] min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] leading-7 outline-none placeholder:text-[#8b92a6] disabled:cursor-not-allowed"
          onChange={(event) => {
            setText(event.target.value);
            grow(event.target);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              if (canSend) onSubmit();
            }
          }}
        />
        <button type="submit" disabled={!canSend} aria-label="ارسال" className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-white transition ${canSend ? ACCENT : "bg-[#a9a5ee]"}`}>
          {busy ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <ArrowUp size={18} aria-hidden />}
        </button>
      </div>
    </form>
  );
}

/** The greeting for the hour of the day in the viewer's own time zone. */
function greeting(hour: number, name: string | null) {
  const part = hour >= 5 && hour < 12 ? "صبح" : hour >= 12 && hour < 16 ? "ظهر" : hour >= 16 && hour < 19 ? "عصر" : "شب";
  return `${name ? `سلام ${name}، ` : "سلام، "}${part} بخیر`;
}

export function ChatApp({ enabled, ownerName }: { enabled: boolean; ownerName: string | null }) {
  const [list, setList] = useState<Summary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<PendingCall[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const [tokens, setTokens] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(false);
  // Known only in the browser (its clock), so it is filled in after the first render.
  const [hello, setHello] = useState<string | null>(null);
  useEffect(() => setHello(greeting(new Date().getHours(), ownerName)), [ownerName, messages.length]);
  const activeRef = useRef<string | null>(null);
  const titled = useRef(new Set<string>());
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Seconds since the current request started, shown next to the token count.
  useEffect(() => {
    if (!busy) return;
    const startedAt = Date.now();
    setElapsed(0);
    setTokens(0);
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [busy]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pending, busy]);

  const focusInput = () => setTimeout(() => inputRef.current?.focus(), 0);

  const reset = useCallback(() => {
    activeRef.current = null;
    setActiveId(null);
    setMessages([]);
    setPending([]);
    setError(null);
    setText("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  }, []);

  const open = useCallback(
    async (id: string) => {
      activeRef.current = id;
      setActiveId(id);
      setMessages([]);
      setPending([]);
      setError(null);
      setLoading(true);
      try {
        const response = await fetch(`/api/ai/conversations/${id}`, { cache: "no-store" });
        if (activeRef.current !== id) return;
        if (!response.ok) {
          // Gone (deleted elsewhere) or never saved: fall back to an empty new chat.
          reset();
          history.replaceState(null, "", "/ai");
          return;
        }
        const data = await response.json();
        setMessages(data.messages);
        setPending(data.pending);
      } catch {
        if (activeRef.current === id) setError("بارگذاری گفتگو ممکن نشد.");
      } finally {
        if (activeRef.current === id) setLoading(false);
      }
    },
    [reset],
  );

  useEffect(() => {
    fetch("/api/ai/conversations", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then(setList)
      .catch(() => {});
    const initial = idFromPath(location.pathname);
    if (initial) void open(initial);
    const onPop = () => {
      const id = idFromPath(location.pathname);
      if (id) void open(id);
      else reset();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open, reset]);

  function startNew() {
    history.pushState(null, "", "/ai");
    reset();
    setSidebar(false);
    focusInput();
  }

  function choose(id: string) {
    setSidebar(false);
    if (id === activeRef.current) return;
    history.pushState(null, "", `/ai/${id}`);
    void open(id);
  }

  async function remove(id: string) {
    // The row (and the dialog inside it) goes away only once the server has deleted it, so the dialog shows its spinner meanwhile.
    const response = await fetch(`/api/ai/conversations/${id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) return setError("حذف گفتگو انجام نشد.");
    if (activeRef.current === id) startNew();
    setList((current) => current.filter((item) => item.id !== id));
  }

  async function persist(id: string, history: ChatMessage[], waiting: PendingCall[]): Promise<boolean> {
    try {
      const response = await fetch(`/api/ai/conversations/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: history, pending: waiting }) });
      if (!response.ok) throw new Error(String(response.status));
      const saved = (await response.json()) as { title: string; updatedAt: string };
      setList((current) => [{ id, title: current.find((item) => item.id === id)?.title ?? saved.title, updatedAt: saved.updatedAt }, ...current.filter((item) => item.id !== id)]);
      return true;
    } catch {
      setError("ذخیرهٔ گفتگو انجام نشد؛ بعد از رفرش ممکن است از تاریخچه حذف شود.");
      return false;
    }
  }

  /** After the first answer, the model names the chat; the list shows the new name when it arrives. */
  async function nameConversation(id: string) {
    if (titled.current.has(id)) return;
    titled.current.add(id);
    try {
      const response = await fetch(`/api/ai/conversations/${id}/title`, { method: "POST" });
      const data = response.ok ? ((await response.json()) as { title: string | null }) : null;
      const title = data?.title;
      if (title) setList((current) => current.map((item) => (item.id === id ? { ...item, title } : item)));
    } catch {}
  }

  async function send(id: string, history: ChatMessage[], decisions: Decisions) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: history, decisions }) });
      if (!response.ok || !response.body) {
        const failure = await response.json().catch(() => null);
        throw new Error(failure?.message ?? "خطا در ارتباط با دستیار.");
      }
      // The server reports each tool as it starts, then sends the final result as the last line.
      let data: (ChatResult & { type: "done" }) | null = null;
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        buffer += value ?? "";
        const lines = buffer.split(String.fromCharCode(10));
        buffer = done ? "" : (lines.pop() ?? "");
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "tool") {
            if (activeRef.current === id) setActivity(event.label);
          } else if (event.type === "tokens") {
            if (activeRef.current === id) setTokens(event.total);
          } else if (event.type === "error") throw new Error(event.message);
          else if (event.type === "done") data = event;
        }
        if (done) break;
      }
      if (!data) throw new Error("پاسخی از دستیار دریافت نشد.");
      const saved = await persist(id, data.messages, data.pending);
      const asked = data.messages.filter((m: ChatMessage) => m.role === "user").length;
      if (saved && asked === 1 && data.pending.length === 0) void nameConversation(id);
      // The owner may have opened another conversation while this one was thinking.
      if (activeRef.current !== id) return;
      setMessages(data.messages);
      setPending(data.pending);
      if (data.notice) setError(data.notice);
    } catch (e) {
      if (activeRef.current === id) setError(e instanceof Error ? e.message : "خطا در ارتباط با دستیار.");
    } finally {
      setBusy(false);
      setActivity(null);
    }
  }

  function submit(value = text) {
    const content = value.trim();
    if (!content || busy || pending.length > 0) return;
    let id = activeRef.current;
    if (!id) {
      id = newId();
      activeRef.current = id;
      setActiveId(id);
      history.pushState(null, "", `/ai/${id}`);
    }
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setText("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setList((current) => (current.some((item) => item.id === id) ? current : [{ id: id!, title: conversationTitle(next), updatedAt: new Date().toISOString() }, ...current]));
    void persist(id, next, []);
    void send(id, next, {});
    focusInput();
  }

  const answers = useRef<Decisions>({});
  function decide(callId: string, decision: "approve" | "reject") {
    const id = activeRef.current;
    if (!id) return;
    answers.current = { ...answers.current, [callId]: decision };
    // Continue once every card has an answer.
    if (pending.every((call) => answers.current[call.id])) {
      const all = answers.current;
      answers.current = {};
      setPending([]);
      void send(id, messages, all);
    } else {
      setPending((current) => [...current]);
    }
  }

  if (!enabled) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-[#d4d8e2] bg-white p-6 text-center text-sm leading-7">
          دستیار خاموش است. مقدار <code dir="ltr" className="rounded bg-[#e6e8f3] px-1.5">AI_API_KEY</code> را در تنظیمات محیط پنل بگذارید و دوباره اجرا کنید.
          <a href="/" className="mt-4 block text-brand underline">بازگشت به پنل</a>
        </div>
      </div>
    );
  }

  const empty = messages.length === 0 && pending.length === 0 && !loading;
  const waiting = pending.length > 0;
  const placeholder = waiting ? "اول کارت‌های بالا را تأیید یا رد کنید" : "از دستیار بپرسید…";

  return (
    <div className="flex h-full">
      {sidebar && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebar(false)} aria-hidden />}

      <aside className={`fixed inset-y-0 start-0 z-40 flex w-72 flex-col border-e border-[#dfe2ee] bg-[#eceef7] transition-transform lg:static lg:translate-x-0 ${sidebar ? "translate-x-0" : "max-lg:translate-x-full"}`}>
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <span className="flex items-center gap-2.5 text-lg font-bold"><Logo size={22} />دستیار نکسورا</span>
          <button type="button" className="rounded-lg p-1.5 text-[#5b6275] hover:bg-[#dfe2ee] lg:hidden" onClick={() => setSidebar(false)} aria-label="بستن"><PanelRightClose size={18} aria-hidden /></button>
        </div>
        <div className="px-3 py-2">
          <button type="button" onClick={startNew} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-brand hover:bg-[#dfe2ee]"><Plus size={18} aria-hidden />گفتگوی جدید</button>
        </div>
        <p className="m-0 px-5 pb-1 pt-3 text-xs text-[#7a8196]">گفتگوهای اخیر</p>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3" aria-label="تاریخچه">
          {list.length === 0 && <p className="m-0 px-2 py-3 text-xs text-[#8b92a6]">هنوز گفتگویی ندارید.</p>}
          {list.map((item) => (
            <div key={item.id} className={`group flex items-center rounded-xl ${item.id === activeId ? "bg-[#dfe2ee]" : "hover:bg-[#e2e5f1]"}`}>
              <button type="button" onClick={() => choose(item.id)} className="min-w-0 flex-1 truncate px-3 py-2 text-start text-sm" title={item.title}>{item.title}</button>
              <ConfirmForm
                action={() => remove(item.id)}
                title="حذف گفتگو"
                message={`گفتگوی «${item.title}» برای همیشه حذف می‌شود و برگشت‌پذیر نیست.`}
                confirmLabel="حذف گفتگو"
                trigger={(open) => (
                  <button type="button" onClick={open} aria-label="حذف گفتگو" className="me-1 rounded-lg p-1.5 text-[#7a8196] opacity-0 hover:bg-[#d3d7e8] hover:text-[#b42318] focus:opacity-100 group-hover:opacity-100"><Trash2 size={15} aria-hidden /></button>
                )}
              />
            </div>
          ))}
        </nav>
        <div className="border-t border-[#dfe2ee] p-3">
          <a href="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#5b6275] hover:bg-[#dfe2ee]"><ArrowRight size={16} aria-hidden />بازگشت به پنل</a>
        </div>
      </aside>

      <main className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 px-3 py-3 lg:hidden">
          <button type="button" className="rounded-lg p-2 hover:bg-[#e6e8f3]" onClick={() => setSidebar(true)} aria-label="تاریخچه"><Menu size={20} aria-hidden /></button>
          <span className="truncate text-sm font-bold">{activeId ? list.find((item) => item.id === activeId)?.title : "گفتگوی جدید"}</span>
        </div>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
            <div className="w-full max-w-4xl">
              <h1 className="m-0 flex items-center justify-center gap-3 text-3xl font-medium"><Logo size={32} /><span className={hello ? "" : "invisible"}>{hello ?? "سلام"}</span></h1>
              <p className="mb-8 mt-3 text-center text-base text-[#7a8196]">چطور می‌تونم کمکت کنم؟</p>
              <Composer text={text} setText={setText} onSubmit={() => submit()} disabled={false} busy={busy} placeholder={placeholder} inputRef={inputRef} />
              {error && <p role="alert" className="mt-3 text-center text-sm text-red-600">{error}</p>}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((item) => (
                  <button key={item} type="button" onClick={() => submit(item)} className="rounded-full border border-[#d4d8e2] bg-white px-4 py-2 text-sm text-[#3a4054] hover:bg-[#e6e8f3]">{item}</button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
                {loading && <div className="grid min-h-[55vh] place-items-center"><BrandLoader /></div>}
                {messages.map((message, index) => {
                  if (message.role === "user") return <UserMessage key={index} text={message.content} />;
                  if (message.role === "assistant")
                    return (
                      <div key={index} className="space-y-3">
                        <ToolCards message={message} all={messages} />
                        <AssistantMessage message={message} />
                      </div>
                    );
                  return null;
                })}

                {pending.map((call) => (
                  <div key={call.id} className="rounded-2xl border border-[#e8c9a7] bg-[#fdf6ec] p-4 text-sm">
                    <p className="m-0 font-bold">{call.label}</p>
                    <pre dir="ltr" className="m-0 mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-white p-3 text-xs">{JSON.stringify(call.input, null, 2)}</pre>
                    <div className="mt-3 flex gap-2">
                      <button type="button" disabled={busy || Boolean(answers.current[call.id])} onClick={() => decide(call.id, "approve")} className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${ACCENT}`}><Check size={16} aria-hidden />تأیید و اجرا</button>
                      <button type="button" disabled={busy || Boolean(answers.current[call.id])} onClick={() => decide(call.id, "reject")} className="inline-flex items-center gap-1.5 rounded-xl border border-[#d4d8e2] bg-white px-4 py-2 text-sm hover:bg-[#e6e8f3] disabled:opacity-50"><X size={16} aria-hidden />رد</button>
                    </div>
                  </div>
                ))}

                {busy && (
                  <div className="flex items-center gap-3 text-sm text-[#7a8196]" aria-live="polite">
                    <Logo size={16} spinning className="m-1" />
                    <span key={activity ?? "thinking"} className="chat-shimmer">{activity ? `در حال استفاده از «${activity}»…` : "در حال فکر کردن…"}</span>
                    <span className="text-xs text-[#8b92a6]" dir="rtl">({formatElapsed(elapsed)}{tokens > 0 ? ` · ↓ ${tokens.toLocaleString("fa-IR")} توکن` : ""})</span>
                  </div>
                )}
                {error && <p role="alert" className="m-0 text-sm text-red-600">{error}</p>}
                <div ref={endRef} />
              </div>
            </div>
            <div className="mx-auto w-full max-w-5xl px-4 pb-4">
              <Composer text={text} setText={setText} onSubmit={() => submit()} disabled={waiting} busy={busy} placeholder={placeholder} inputRef={inputRef} />
              <p className="m-0 mt-2 text-center text-xs text-[#8b92a6]">دستیار ممکن است اشتباه کند؛ هر تغییری فقط با تأیید شما اجرا می‌شود.</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
