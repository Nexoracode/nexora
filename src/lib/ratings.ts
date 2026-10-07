import { db } from "@/lib/db";

export type RatingSummary = { featureKey: string | null; packageId: string | null; average: number; count: number; distribution: [number, number, number, number, number] };

/** Every feature's and package's star summary across all sites, plus what this one site gave. */
export async function loadRatings(siteId: string) {
  const [grouped, mine] = await Promise.all([
    db.rating.groupBy({ by: ["featureKey", "packageId", "stars"], _count: { _all: true } }),
    db.rating.findMany({ where: { siteId }, select: { featureKey: true, packageId: true, stars: true } }),
  ]);
  const summaries = new Map<string, RatingSummary & { total: number }>();
  for (const row of grouped) {
    const target = row.featureKey ?? row.packageId;
    if (!target || row.stars < 1 || row.stars > 5) continue;
    const entry = summaries.get(target) ?? { featureKey: row.featureKey, packageId: row.packageId, average: 0, count: 0, distribution: [0, 0, 0, 0, 0] as RatingSummary["distribution"], total: 0 };
    entry.distribution[row.stars - 1] += row._count._all;
    entry.count += row._count._all;
    entry.total += row.stars * row._count._all;
    summaries.set(target, entry);
  }
  const ratings: RatingSummary[] = [...summaries.values()].map(({ total, ...entry }) => ({ ...entry, average: Math.round((total / entry.count) * 10) / 10 }));
  return { ratings, myRatings: mine };
}
