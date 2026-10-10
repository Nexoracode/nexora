import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";
import { GatewayForm } from "./gateway-form";
import { OwnerForm } from "./owner-form";
import { SettingsTabs } from "./settings-tabs";
import { SmsForm } from "./sms-form";
import { SupportForm } from "./support-form";

export default async function SettingsPage() {
  const [owner, gateway, sms] = await Promise.all([
    db.ownerSettings.findUnique({ where: { id: "main" } }),
    db.gatewaySetting.findUnique({ where: { provider: "ZARINPAL" } }),
    db.smsSettings.findUnique({ where: { id: "main" } }),
  ]);
  return (
    <>
      <PageHeader title="تنظیمات" />
      <SettingsTabs
        panels={[
          {
            id: "card",
            label: "کارت‌به‌کارت",
            content: (
              <OwnerForm
                defaults={{
                  holderName: owner?.holderName ?? "",
                  cardNumber: owner?.cardNumber ?? "",
                  sheba: owner?.sheba ?? "",
                  bankName: owner?.bankName ?? "",
                  contactPhone: owner?.contactPhone ?? "",
                  note: owner?.note ?? "",
                }}
              />
            ),
          },
          { id: "gateway", label: "درگاه پرداخت", content: <GatewayForm masked={gateway?.credentialMasked ?? null} isSandbox={gateway?.isSandbox ?? false} isActive={gateway?.isActive ?? true} /> },
          { id: "sms", label: "پیامک", content: <SmsForm masked={sms?.apiKeyMasked ?? null} lineNumber={sms?.lineNumber ?? ""} isActive={sms?.isActive ?? false} /> },
          { id: "support", label: "پشتیبانی", content: <SupportForm ticketPrice={owner ? Number(owner.ticketPrice) : 0} /> },
        ]}
      />
    </>
  );
}
