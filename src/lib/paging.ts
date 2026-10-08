/** Rows per page the panel's tables offer; the first is the default. */
export const PAGE_SIZES = [10, 20, 50] as const;
export const PAGE_SIZE = PAGE_SIZES[0];

/** The page size for a `size` search param: one of the offered sizes, else the default. */
export function readSize(sizeParam: string | undefined): number {
  const size = Number.parseInt(sizeParam ?? "", 10);
  return (PAGE_SIZES as readonly number[]).includes(size) ? size : PAGE_SIZE;
}

/** The page to show for a `page` search param: whole, within 1..pageCount, and the rows to skip. */
export function readPage(pageParam: string | undefined, total: number, sizeParam?: string) {
  const size = readSize(sizeParam);
  const pageCount = Math.max(1, Math.ceil(total / size));
  const page = Math.min(pageCount, Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1));
  return { page, pageCount, skip: (page - 1) * size, take: size, size };
}
