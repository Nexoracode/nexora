import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";
import { OwnerForm } from "./owner-form";

export default async function OwnerSettingsPage() {
  const owner = await db.ownerSettings.findUnique({ where: { id: "main" } });
  return (
    <>
      <PageHeader title="اطلاعات حساب" description="این اطلاعات روی صفحهٔ «خرید قابلیت» سایت مشتری‌ها نمایش داده می‌شود." />
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
    </>
  );
}
