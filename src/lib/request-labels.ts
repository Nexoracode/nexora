import { DEFAULT_SUBSCRIPTION_SETTINGS, periodLabels, periodPrice, type SubscriptionPeriod } from "@/lib/subscription";

type RequestLike = {
  period: SubscriptionPeriod | null;
  amount: unknown;
  feature: { title: string; price: unknown } | null;
  package: { name: string; price: unknown; monthlyPrice: unknown } | null;
};

/** What a purchase request is for: a feature, a package, or a plan subscription with its period. */
export function requestSubject(request: RequestLike) {
  if (request.feature) return request.feature.title;
  const name = request.package?.name ?? "";
  return request.period ? `اشتراک ${name} (${periodLabels[request.period]})` : `بستهٔ ${name}`;
}

/** What the request costs: the charged amount when online, otherwise the list price (a subscription's from its period). */
export function requestAmount(request: RequestLike, settings: Parameters<typeof periodPrice>[2] = DEFAULT_SUBSCRIPTION_SETTINGS) {
  if (request.amount !== null && request.amount !== undefined) return Number(request.amount);
  if (request.period && request.package?.monthlyPrice != null) return periodPrice(Number(request.package.monthlyPrice), request.period, settings);
  return Number((request.feature ?? request.package)?.price ?? 0);
}
