import { Star } from "lucide-react";
import type { RatingAverage } from "@/lib/ratings";

/** "★ ۴٫۲ (۱۲)" for a rated feature or package, a dash while nobody has rated it. */
export function RatingCell({ rating }: { rating?: RatingAverage }) {
  if (!rating || rating.count === 0) return <span className="text-slate-400">بدون امتیاز</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Star size={15} aria-hidden className="fill-amber-400 text-amber-400" />
      <strong>{rating.average.toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong>
      <span className="text-xs text-slate-500">({rating.count.toLocaleString("fa-IR")} نفر)</span>
    </span>
  );
}
