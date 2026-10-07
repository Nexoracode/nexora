import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";
import { DEFAULT_SUBSCRIPTION_SETTINGS } from "@/lib/subscription";
import { SubscriptionForm } from "./subscription-form";

export default async function SubscriptionSettingsPage() {
  const stored = await db.subscriptionSettings.findUnique({ where: { id: "main" } });
  const settings = {
    quarterlyDiscountPercent: stored?.quarterlyDiscountPercent ?? DEFAULT_SUBSCRIPTION_SETTINGS.quarterlyDiscountPercent,
    yearlyDiscountPercent: stored?.yearlyDiscountPercent ?? DEFAULT_SUBSCRIPTION_SETTINGS.yearlyDiscountPercent,
    graceDays: stored?.graceDays ?? DEFAULT_SUBSCRIPTION_SETTINGS.graceDays,
    retentionDays: stored?.retentionDays ?? DEFAULT_SUBSCRIPTION_SETTINGS.retentionDays,
    lockAfterGrace: stored?.lockAfterGrace ?? DEFAULT_SUBSCRIPTION_SETTINGS.lockAfterGrace,
    reminderDays: stored?.reminderDays ?? DEFAULT_SUBSCRIPTION_SETTINGS.reminderDays,
  };

  return (
    <>
      <PageHeader title="تنظیمات اشتراک" description="تخفیف دوره‌های بلندتر، مهلت پس از پایان، نگه‌داری داده و اینکه بعد از مهلت چه چیزی قفل شود. قیمت پلن‌ها در صفحه‌ی «پلن‌های اشتراک» دیده می‌شود." />
      <SubscriptionForm defaults={settings} />
    </>
  );
}
