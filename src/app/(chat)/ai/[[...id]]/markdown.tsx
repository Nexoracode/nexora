import { Children, type ReactNode } from "react";
import { Check } from "lucide-react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { isStatusWord, statusPattern } from "@/lib/ai-status";
import { Stars } from "./card-ui";
import { StatusChip } from "./status-chip";

const starRun = /([★⭐☆]+)/;

/** Turns status words (OPEN, APPROVED...) into Persian colour chips and ★ runs into yellow stars; everything else is left alone. */
function chipify(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child !== "string") return child;
    return child.split(starRun).map((piece, index) => {
      if (index % 2 === 1) {
        const filled = [...piece].filter((c) => c !== "☆").length;
        return <Stars key={index} value={filled} total={[...piece].length} />;
      }
      const parts = piece.split(statusPattern);
      if (parts.length === 1) return piece;
      return parts.map((part, i) => (i % 2 === 1 && isStatusWord(part) ? <StatusChip key={`${index}-${i}`} word={part} /> : part));
    });
  });
}

/** The text of an element whose only child is a string, e.g. the **OPEN** in **OPEN**. */
function onlyText(children: ReactNode): string | null {
  const items = Children.toArray(children);
  return items.length === 1 && typeof items[0] === "string" ? items[0].trim() : null;
}

/** Raw HTML is not enabled, so model text cannot inject markup. */
/** react-markdown hands every component its `node`; spreading that onto a DOM element would print "[object Object]". */
function clean<T extends object>(props: T): Omit<T, "node"> {
  const { node: _node, ...rest } = props as T & { node?: unknown };
  return rest;
}

const components: Components = {
  p: ({ children, ...props }) => <p className="my-3 first:mt-0 last:mb-0" {...clean(props)}>{chipify(children)}</p>,
  h1: (props) => <h3 className="mb-2 mt-6 text-lg font-bold first:mt-0" {...clean(props)} />,
  h2: (props) => <h3 className="mb-2 mt-6 text-lg font-bold first:mt-0" {...clean(props)} />,
  h3: (props) => <h4 className="mb-2 mt-5 text-base font-bold first:mt-0" {...clean(props)} />,
  h4: (props) => <h4 className="mb-1.5 mt-4 text-base font-bold first:mt-0" {...clean(props)} />,
  ul: ({ className, ...props }) => (className?.includes("contains-task-list") ? <ul className="my-3 list-none space-y-2.5 p-0" {...clean(props)} /> : <ul className="my-3 list-disc space-y-1.5 ps-6 marker:text-[#7a8196]" {...clean(props)} />),
  ol: (props) => <ol className="my-3 list-decimal space-y-1.5 ps-6 marker:text-[#7a8196]" {...clean(props)} />,
  li: ({ children, className, ...props }) => <li className={className?.includes("task-list-item") ? "relative ps-8" : "ps-1"} {...clean(props)}>{chipify(children)}</li>,
  // A task-list box becomes a green tick (done) or an empty grey circle.
  input: ({ checked, type }) => (type === "checkbox" ? (checked ? <span className="absolute start-0 top-1.5 grid size-5 place-items-center rounded-full bg-green-100 text-green-600"><Check size={13} strokeWidth={3} aria-label="انجام شده" /></span> : <span aria-label="انجام نشده" className="absolute start-0 top-1.5 size-5 rounded-full border-2 border-slate-300" />) : null),
  strong: ({ children, ...props }) => {
    const word = onlyText(children);
    return word && isStatusWord(word) ? <StatusChip word={word} /> : <strong className="font-bold" {...clean(props)}>{chipify(children)}</strong>;
  },
  a: (props) => <a className="text-brand underline underline-offset-2" target="_blank" rel="noreferrer noopener" {...clean(props)} />,
  hr: () => <hr className="my-5 border-[#dfe2ee]" />,
  blockquote: (props) => <blockquote className="my-3 border-s-4 border-[#cdd2e2] ps-4 text-[#5b6275]" {...clean(props)} />,
  pre: (props) => <pre dir="ltr" className="my-3 overflow-x-auto rounded-xl bg-[#1f2330] p-4 text-[13px] leading-6 text-[#f1efe7]" {...clean(props)} />,
  code: ({ className, children, ...props }) => {
    const word = className ? null : onlyText(children);
    if (word && isStatusWord(word)) return <StatusChip word={word} />;
    return <code className={className ? "font-mono" : "rounded-md bg-[#e6e8f3] px-1.5 py-0.5 font-mono text-[0.85em]"} {...clean(props)}>{children}</code>;
  },
  table: (props) => <div className="my-4 overflow-x-auto rounded-2xl border border-[#dfe2ee] bg-white"><table className="w-full text-sm" {...clean(props)} /></div>,
  thead: (props) => <thead className="bg-slate-50 text-slate-500" {...clean(props)} />,
  tr: (props) => <tr className="border-t border-slate-100 first:border-t-0 hover:bg-slate-50" {...clean(props)} />,
  th: ({ children, ...props }) => <th className="whitespace-nowrap px-4 py-3 text-start font-medium" {...clean(props)}>{chipify(children)}</th>,
  td: ({ children, ...props }) => <td className="px-4 py-3" {...clean(props)}>{chipify(children)}</td>,
};

export function MarkdownText({ children }: { children: string }) {
  return <Markdown remarkPlugins={[remarkGfm]} components={components}>{children}</Markdown>;
}
