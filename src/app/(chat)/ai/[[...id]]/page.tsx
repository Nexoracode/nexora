import type { Metadata } from "next";
import { ai } from "@/lib/env";
import { ChatApp } from "./chat-app";

export const metadata: Metadata = { title: "دستیار نکسورا" };

// /ai starts a new chat and /ai/<id> opens a saved one; the client app reads the id from the address itself.
export default function AiPage() {
  return <ChatApp enabled={ai.enabled} />;
}
