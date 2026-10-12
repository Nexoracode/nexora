import type { ReactNode } from "react";
import { requireOwnerPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** The assistant is a full-page app of its own: no panel header or sidebar, just the owner's session check. */
export default async function ChatLayout({ children }: { children: ReactNode }) {
  await requireOwnerPage();
  return <div className="fixed inset-0 bg-[#f6f7fb] text-[#1f2330]">{children}</div>;
}
