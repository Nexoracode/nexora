import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";
import { OwnerForm } from "./owner-form";
import { SettingsTabs } from "./settings-tabs";
import { SupportForm } from "./support-form";

export default async function SettingsPage() {
  const owner = await db.ownerSettings.findUnique({ where: { id: "main" } });
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
          { id: "support", label: "پشتیبانی", content: <SupportForm ticketPrice={owner ? Number(owner.ticketPrice) : 0} /> },
        ]}
      />
    </>
  );
}
