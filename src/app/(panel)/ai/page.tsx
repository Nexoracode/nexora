import { PageHeader } from "@/components/page-header";
import { env } from "@/lib/env";
import { AiChat } from "./ai-chat";

export default function AiPage() {
  return (
    <>
      <PageHeader title="هوش مصنوعی" />
      <AiChat configured={Boolean(env.DEEPSEEK_API_KEY)} />
    </>
  );
}
