/** Rows per page in the panel's tables. */
export const PAGE_SIZE = 10;

/** The page to show for a `page` search param: whole, within 1..pageCount, and the rows to skip. */
export function readPage(pageParam: string | undefined, total: number, size = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(total / size));
  const page = Math.min(pageCount, Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1));
  return { page, pageCount, skip: (page - 1) * size, take: size };
}
