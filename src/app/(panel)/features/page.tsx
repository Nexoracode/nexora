import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { db } from "@/lib/db";
import { readPage } from "@/lib/paging";
import { loadRatingAverages } from "@/lib/ratings";
import { FeaturesTable } from "./features-table";

export default async function FeaturesPage({ searchParams }: { searchParams: Promise<{ q?: string; group?: string; active?: string; page?: string; size?: string }> }) {
  const { q = "", group = "", active = "", page: pageParam, size: sizeParam } = await searchParams;
  const query = q.trim().slice(0, 100);
  const groups = (await db.feature.findMany({ select: { group: true }, distinct: ["group"], orderBy: { group: "asc" } })).map((row) => row.group);
  const groupFilter = groups.includes(group) ? group : "";
  const activeFilter = active === "yes" ? true : active === "no" ? false : undefined;
  const where = {
    ...(query ? { title: { contains: query } } : {}),
    ...(groupFilter ? { group: groupFilter } : {}),
    ...(activeFilter !== undefined ? { isActive: activeFilter } : {}),
  };
  const total = await db.feature.count({ where });
  const { page, pageCount, skip, take, size } = readPage(pageParam, total, sizeParam);
  const ratings = (await loadRatingAverages()).features;
  const features = await db.feature.findMany({ where, orderBy: { sortOrder: "asc" }, skip, take });

  return (
    <>
      <PageHeader title="قابلیت‌ها و قیمت" description="روی هر قابلیت بزنید تا توضیحش را ببینید. با آیکون‌ها ویرایش یا غیرفعالش کنید." />
      <FeaturesTable groups={groups} ratings={ratings} features={features.map((f) => ({ key: f.key, title: f.title, description: f.description ?? "", group: f.group, price: Number(f.price), isActive: f.isActive }))} />
      <Pagination page={page} pageCount={pageCount} basePath="/features" params={{ q: query, group: groupFilter, active: activeFilter === undefined ? "" : active }} size={size} total={total} />
    </>
  );
}
