"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, passwordMatches, requireOwnerAction } from "@/lib/auth";
import { db } from "@/lib/db";
import { grantPurchase } from "@/lib/purchases";
import { generateLicenseKey, normalizeDomain } from "@/lib/license-token";
import { normalizeDigits } from "@/lib/format";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; key?: string; siteId?: string; saved?: boolean };

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { error: "رمز عبور اشتباه است." };
  }
  await createSession();
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const priceField = z.preprocess(
  (v) => normalizeDigits(String(v ?? "")).replace(/[,٬\s]/g, "") || "0",
  z.string().regex(/^\d{1,12}$/, "مبلغ را به‌صورت عدد صحیح وارد کنید."),
);

const siteSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(3, "دامنه را وارد کنید.")
    .max(191, "دامنه حداکثر ۱۹۱ نویسه است.")
    .transform(normalizeDomain)
    .refine((v) => /^[a-z0-9.-]+\.[a-z0-9-]{2,}$|^localhost$/.test(v), "دامنه معتبر نیست."),
  clientName: z.string().trim().min(1, "نام مشتری را وارد کنید.").max(120, "نام مشتری حداکثر ۱۲۰ نویسه است."),
  clientPhone: z.string().trim().max(20, "شماره حداکثر ۲۰ نویسه است.").optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  contractPrice: priceField,
  expiresAt: z.string().optional(),
  notes: z.string().trim().max(1000, "یادداشت حداکثر ۱۰۰۰ نویسه است.").optional(),
});

function readSiteForm(formData: FormData) {
  const parsed = siteSchema.safeParse({
    domain: formData.get("domain"),
    clientName: formData.get("clientName"),
    clientPhone: formData.get("clientPhone") || undefined,
    status: formData.get("status") ?? "ACTIVE",
    contractPrice: formData.get("contractPrice"),
    expiresAt: formData.get("expiresAt") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, fieldErrors } as const;
  }
  return { ok: true, data: parsed.data, featureKeys: formData.getAll("features").map(String) } as const;
}

async function validFeatureKeys(keys: string[]) {
  const known = await db.feature.findMany({ where: { key: { in: keys } }, select: { key: true } });
  return known.map((f) => f.key);
}

const formError = (fieldErrors: Record<string, string>): FormState => ({ fieldErrors, error: "فرم دارای خطاست." });

export async function createSiteAction(_: FormState, formData: FormData): Promise<FormState> {
  await requireOwnerAction();
  const result = readSiteForm(formData);
  if (!result.ok) return formError(result.fieldErrors);
  const { data } = result;
  if (await db.site.findUnique({ where: { domain: data.domain }, select: { id: true } })) return formError({ domain: "برای این دامنه قبلاً سایت ثبت شده است." });

  const license = generateLicenseKey();
  const featureKeys = await validFeatureKeys(result.featureKeys);
  const client = await db.client.upsert({
    where: { name: data.clientName },
    create: { name: data.clientName, phone: data.clientPhone },
    update: data.clientPhone ? { phone: data.clientPhone } : {},
  });
  const site = await db.site.create({
    data: {
      clientId: client.id,
      domain: data.domain,
      licenseKeyHash: license.hash,
      keyPrefix: license.prefix,
      status: data.status,
      contractPrice: data.contractPrice,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      notes: data.notes,
      features: { create: featureKeys.map((featureKey) => ({ featureKey })) },
      events: { create: { type: "SITE_CREATED", message: `سایت با ${featureKeys.length} قابلیت ثبت شد.` } },
    },
    select: { id: true },
  });
  revalidatePath("/");
  return { key: license.key, siteId: site.id };
}

export async function updateSiteAction(siteId: string, _: FormState, formData: FormData): Promise<FormState> {
  await requireOwnerAction();
  const result = readSiteForm(formData);
  if (!result.ok) return formError(result.fieldErrors);
  const { data } = result;
  const current = await db.site.findUnique({ where: { id: siteId }, select: { status: true, features: { select: { featureKey: true } } } });
  if (!current) return { error: "سایت پیدا نشد." };
  const clash = await db.site.findUnique({ where: { domain: data.domain }, select: { id: true } });
  if (clash && clash.id !== siteId) return formError({ domain: "برای این دامنه قبلاً سایت ثبت شده است." });

  const featureKeys = await validFeatureKeys(result.featureKeys);
  const before = new Set(current.features.map((f) => f.featureKey));
  const featuresChanged = before.size !== featureKeys.length || featureKeys.some((k) => !before.has(k));
  const client = await db.client.upsert({
    where: { name: data.clientName },
    create: { name: data.clientName, phone: data.clientPhone },
    update: data.clientPhone ? { phone: data.clientPhone } : {},
  });
  const events = [
    ...(featuresChanged ? [{ type: "FEATURES_CHANGED" as const, message: `قابلیت‌ها: ${featureKeys.length} مورد فعال.` }] : []),
    ...(current.status !== data.status ? [{ type: "STATUS_CHANGED" as const, message: data.status === "ACTIVE" ? "سایت فعال شد." : "سایت تعلیق شد." }] : []),
  ];
  await db.site.update({
    where: { id: siteId },
    data: {
      clientId: client.id,
      domain: data.domain,
      status: data.status,
      contractPrice: data.contractPrice,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      notes: data.notes ?? null,
      features: { deleteMany: {}, create: featureKeys.map((featureKey) => ({ featureKey })) },
      events: { create: events },
    },
    select: { id: true },
  });
  revalidatePath("/");
  revalidatePath(`/sites/${siteId}`);
  return { saved: true };
}

export async function rotateKeyAction(siteId: string): Promise<FormState> {
  await requireOwnerAction();
  const license = generateLicenseKey();
  await db.site.update({
    where: { id: siteId },
    data: { licenseKeyHash: license.hash, keyPrefix: license.prefix, events: { create: { type: "KEY_ROTATED", message: "کلید لایسنس بازتولید شد." } } },
    select: { id: true },
  });
  revalidatePath(`/sites/${siteId}`);
  return { key: license.key };
}

export async function deleteSiteAction(siteId: string) {
  await requireOwnerAction();
  await db.site.delete({ where: { id: siteId }, select: { id: true } });
  revalidatePath("/");
  redirect("/");
}

const featureRowSchema = z.object({
  title: z.string().trim().min(1, "عنوان را وارد کنید.").max(120, "عنوان حداکثر ۱۲۰ نویسه است."),
  group: z.string().trim().min(1, "گروه را وارد کنید.").max(80, "گروه حداکثر ۸۰ نویسه است."),
  description: z.string().trim().max(500, "توضیح حداکثر ۵۰۰ نویسه است."),
  price: priceField,
  isActive: z.boolean(),
});

export async function saveFeatureAction(key: string, _: FormState, formData: FormData): Promise<FormState> {
  await requireOwnerAction();
  const parsed = featureRowSchema.safeParse({
    title: formData.get("title"),
    group: formData.get("group"),
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return formError(fieldErrors);
  }
  if (!(await db.feature.findUnique({ where: { key }, select: { key: true } }))) return { error: "قابلیت پیدا نشد." };
  const { description, ...rest } = parsed.data;
  await db.feature.update({ where: { key }, data: { ...rest, description: description || null }, select: { key: true } });
  revalidatePath("/features");
  return { saved: true };
}

/** Switches a feature between "can be bought" and "temporarily unavailable"; sites that already own it keep it. */
export async function toggleFeatureActiveAction(key: string) {
  await requireOwnerAction();
  const feature = await db.feature.findUnique({ where: { key }, select: { isActive: true } });
  if (!feature) return;
  await db.feature.update({ where: { key }, data: { isActive: !feature.isActive }, select: { key: true } });
  revalidatePath("/features");
}

const packageSchema = z.object({ name: z.string().trim().min(1, "نام بسته را وارد کنید.").max(120, "نام بسته حداکثر ۱۲۰ نویسه است."), price: priceField });

export async function savePackageAction(packageId: string | null, _: FormState, formData: FormData): Promise<FormState> {
  await requireOwnerAction();
  const parsed = packageSchema.safeParse({ name: formData.get("name"), price: formData.get("price") });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return formError(fieldErrors);
  }
  const features = (await validFeatureKeys(formData.getAll("features").map(String))).map((featureKey) => ({ featureKey }));
  if (packageId) {
    await db.package.update({ where: { id: packageId }, data: { ...parsed.data, features: { deleteMany: {}, create: features } }, select: { id: true } });
    revalidatePath("/packages");
    revalidatePath(`/packages/${packageId}`);
    return { saved: true };
  }
  await db.package.create({ data: { ...parsed.data, features: { create: features } }, select: { id: true } });
  revalidatePath("/packages");
  redirect("/packages");
}

export async function deletePackageAction(packageId: string) {
  await requireOwnerAction();
  await db.package.delete({ where: { id: packageId }, select: { id: true } });
  revalidatePath("/packages");
  redirect("/packages");
}

const digitsOnly = (value: unknown) => normalizeDigits(String(value ?? "")).replace(/[\s-]/g, "");

const ownerSchema = z.object({
  holderName: z.string().trim().max(120, "نام صاحب حساب حداکثر ۱۲۰ نویسه است."),
  cardNumber: z.string().regex(/^(\d{16})?$/, "شماره کارت باید دقیقاً ۱۶ رقم باشد."),
  sheba: z.string().regex(/^(IR\d{24})?$/, "شبا باید با IR شروع شود و ۲۴ رقم داشته باشد."),
  bankName: z.string().trim().max(60, "نام بانک حداکثر ۶۰ نویسه است."),
  contactPhone: z.string().regex(/^(09\d{9})?$/, "شماره تماس باید به‌صورت 09xxxxxxxxx و ۱۱ رقم باشد."),
  note: z.string().trim().max(500, "توضیح حداکثر ۵۰۰ نویسه است."),
});

export async function saveOwnerSettingsAction(_: FormState, formData: FormData): Promise<FormState> {
  await requireOwnerAction();
  const parsed = ownerSchema.safeParse({
    holderName: formData.get("holderName") ?? "",
    cardNumber: digitsOnly(formData.get("cardNumber")),
    sheba: digitsOnly(formData.get("sheba")).toUpperCase(),
    bankName: formData.get("bankName") ?? "",
    contactPhone: digitsOnly(formData.get("contactPhone")),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return formError(fieldErrors);
  }
  const data = Object.fromEntries(Object.entries(parsed.data).map(([key, value]) => [key, value || null]));
  await db.ownerSettings.upsert({ where: { id: "main" }, create: { id: "main", ...data }, update: data });
  revalidatePath("/settings");
  return { saved: true };
}

export async function resolvePurchaseAction(requestId: string, decision: "APPROVED" | "REJECTED") {
  await requireOwnerAction();
  if (decision === "APPROVED") {
    await grantPurchase(requestId, "PENDING");
  } else {
    const request = await db.purchaseRequest.findUnique({ where: { id: requestId }, include: { feature: { select: { title: true } }, package: { select: { name: true } } } });
    if (!request || request.status !== "PENDING") return;
    const title = request.feature?.title ?? (request.package ? `بستهٔ ${request.package.name}` : "قابلیت");
    await db.$transaction([
      db.purchaseRequest.update({ where: { id: requestId }, data: { status: "REJECTED", resolvedAt: new Date() }, select: { id: true } }),
      db.licenseEvent.create({ data: { siteId: request.siteId, type: "PURCHASE_RESOLVED", message: `خرید «${title}» رد شد.` } }),
    ]);
  }
  revalidatePath("/requests");
  revalidatePath("/");
}
