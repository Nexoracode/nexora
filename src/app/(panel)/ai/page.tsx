import { PageHeader } from "@/components/page-header";
import { ai } from "@/lib/env";
import { AiChat } from "./ai-chat";

export default function AiPage() {
  return (
    <>
      <PageHeader title="دستیار هوشمند" description="پرسش دربارهٔ سایت‌ها، خریدها و تیکت‌ها. هر تغییری فقط با تأیید شما اجرا می‌شود." />
      <AiChat enabled={ai.enabled} />
    </>
  );
}
