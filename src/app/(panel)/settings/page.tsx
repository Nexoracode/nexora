import { db } from "@/lib/db";
import { OwnerForm } from "./owner-form";

export default async function OwnerSettingsPage() {
  const owner = await db.ownerSettings.findUnique({ where: { id: "main" } });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">اطلاعات حساب شما</h1>
      <p className="text-sm text-slate-500">این اطلاعات روی صفحهٔ «خرید قابلیت» سایت مشتری‌ها نمایش داده می‌شود.</p>
      <OwnerForm
        defaults={{
          holderName: owner?.holderName ?? "",
          cardNumber: owner?.cardNumber ?? "",
          sheba: owner?.sheba ?? "",
          bankName: owner?.bankName ?? "",
          contactPhone: owner?.contactPhone ?? "",
          onlineMerchantId: owner?.onlineMerchantId ?? "",
          onlineSandbox: owner?.onlineSandbox ?? false,
          note: owner?.note ?? "",
        }}
      />
    </div>
  );
}
