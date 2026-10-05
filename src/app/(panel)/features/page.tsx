import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { db } from "@/lib/db";
import { FeaturesTable } from "./features-table";

const PAGE_SIZE = 8;

export default async function FeaturesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const total = await db.feature.count();
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1));
  const features = await db.feature.findMany({ orderBy: { sortOrder: "asc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE });

  return (
    <>
      <PageHeader title="قابلیت‌ها و قیمت" description="روی هر قابلیت بزنید تا توضیحش را ببینید. با آیکون‌ها ویرایش یا غیرفعالش کنید." />
      <FeaturesTable features={features.map((f) => ({ key: f.key, title: f.title, description: f.description ?? "", group: f.group, price: Number(f.price), isActive: f.isActive }))} />
      <Pagination page={page} pageCount={pageCount} basePath="/features" />
    </>
  );
}
