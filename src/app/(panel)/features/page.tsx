import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { db } from "@/lib/db";
import { readPage } from "@/lib/paging";
import { loadRatingAverages } from "@/lib/ratings";
import { FeaturesTable } from "./features-table";

export default async function FeaturesPage({ searchParams }: { searchParams: Promise<{ page?: string; size?: string }> }) {
  const { page: pageParam, size: sizeParam } = await searchParams;
  const total = await db.feature.count();
  const { page, pageCount, skip, take, size } = readPage(pageParam, total, sizeParam);
  const ratings = (await loadRatingAverages()).features;
  const features = await db.feature.findMany({ orderBy: { sortOrder: "asc" }, skip, take });

  return (
    <>
      <PageHeader title="قابلیت‌ها و قیمت" description="روی هر قابلیت بزنید تا توضیحش را ببینید. با آیکون‌ها ویرایش یا غیرفعالش کنید." />
      <FeaturesTable ratings={ratings} features={features.map((f) => ({ key: f.key, title: f.title, description: f.description ?? "", group: f.group, price: Number(f.price), isActive: f.isActive }))} />
      <Pagination page={page} pageCount={pageCount} basePath="/features" size={size} total={total} />
    </>
  );
}
