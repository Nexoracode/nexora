type RequestLike = {
  amount: unknown;
  feature: { title: string; price: unknown } | null;
  package: { name: string; price: unknown } | null;
};

/** What a purchase request is for: a feature or a package. */
export function requestSubject(request: RequestLike) {
  return request.feature ? request.feature.title : `بستهٔ ${request.package?.name ?? ""}`;
}

/** What the request costs: the charged amount when online, otherwise the list price. */
export function requestAmount(request: RequestLike) {
  if (request.amount !== null && request.amount !== undefined) return Number(request.amount);
  return Number((request.feature ?? request.package)?.price ?? 0);
}
