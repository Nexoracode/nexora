import { Children, isValidElement, type ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { isStatusWord, statusChips, statusPattern, type StatusWord } from "@/lib/ai-status";

function StatusChip({ word }: { word: StatusWord }) {
  const chip = statusChips[word];
  return <span className={`mx-0.5 inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 align-middle text-xs font-medium leading-5 ${chip.className}`}>{chip.label}</span>;
}

/** Turns status words (OPEN, APPROVED...) inside text into Persian colour chips, leaving everything else alone. */
function chipify(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string") {
      const parts = child.split(statusPattern);
      if (parts.length === 1) return child;
      return parts.map((part, index) => (index % 2 === 1 && isStatusWord(part) ? <StatusChip key={index} word={part} /> : part));
    }
    return child;
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
  ul: (props) => <ul className="my-3 list-disc space-y-1.5 ps-6 marker:text-[#7a8196]" {...clean(props)} />,
  ol: (props) => <ol className="my-3 list-decimal space-y-1.5 ps-6 marker:text-[#7a8196]" {...clean(props)} />,
  li: ({ children, ...props }) => <li className="ps-1" {...clean(props)}>{chipify(children)}</li>,
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
  table: (props) => <div className="my-4 overflow-x-auto rounded-xl border border-[#dfe2ee]"><table className="w-full border-collapse text-start text-sm" {...clean(props)} /></div>,
  th: (props) => <th className="border-b border-[#dfe2ee] bg-[#eef0f8] px-3 py-2.5 text-start font-bold" {...clean(props)} />,
  td: ({ children, ...props }) => <td className="border-b border-[#e6e8f3] px-3 py-2.5" {...clean(props)}>{chipify(children)}</td>,
};

export function MarkdownText({ children }: { children: string }) {
  return <Markdown remarkPlugins={[remarkGfm]} components={components}>{children}</Markdown>;
}
