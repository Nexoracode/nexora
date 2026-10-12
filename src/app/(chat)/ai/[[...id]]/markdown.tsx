import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/** Raw HTML is not enabled, so model text cannot inject markup. */
const components: Components = {
  p: (props) => <p className="my-3 first:mt-0 last:mb-0" {...props} />,
  h1: (props) => <h3 className="mb-2 mt-6 text-lg font-bold first:mt-0" {...props} />,
  h2: (props) => <h3 className="mb-2 mt-6 text-lg font-bold first:mt-0" {...props} />,
  h3: (props) => <h4 className="mb-2 mt-5 text-base font-bold first:mt-0" {...props} />,
  h4: (props) => <h4 className="mb-1.5 mt-4 text-base font-bold first:mt-0" {...props} />,
  ul: (props) => <ul className="my-3 list-disc space-y-1.5 ps-6 marker:text-[#7a8196]" {...props} />,
  ol: (props) => <ol className="my-3 list-decimal space-y-1.5 ps-6 marker:text-[#7a8196]" {...props} />,
  li: (props) => <li className="ps-1" {...props} />,
  strong: (props) => <strong className="font-bold" {...props} />,
  a: (props) => <a className="text-brand underline underline-offset-2" target="_blank" rel="noreferrer noopener" {...props} />,
  hr: () => <hr className="my-5 border-[#dfe2ee]" />,
  blockquote: (props) => <blockquote className="my-3 border-s-4 border-[#cdd2e2] ps-4 text-[#5b6275]" {...props} />,
  pre: (props) => <pre dir="ltr" className="my-3 overflow-x-auto rounded-xl bg-[#1f2330] p-4 text-[13px] leading-6 text-[#f1efe7]" {...props} />,
  code: ({ className, ...props }) => <code className={className ? "font-mono" : "rounded-md bg-[#e6e8f3] px-1.5 py-0.5 font-mono text-[0.85em]"} {...props} />,
  table: (props) => <div className="my-4 overflow-x-auto rounded-xl border border-[#dfe2ee]"><table className="w-full border-collapse text-start text-sm" {...props} /></div>,
  th: (props) => <th className="border-b border-[#dfe2ee] bg-[#eef0f8] px-3 py-2.5 text-start font-bold" {...props} />,
  td: (props) => <td className="border-b border-[#e6e8f3] px-3 py-2.5" {...props} />,
};

export function MarkdownText({ children }: { children: string }) {
  return <Markdown remarkPlugins={[remarkGfm]} components={components}>{children}</Markdown>;
}
