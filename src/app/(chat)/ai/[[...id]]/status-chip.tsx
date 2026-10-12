import { statusChips, type StatusWord } from "@/lib/ai-status";

export function StatusChip({ word }: { word: StatusWord }) {
  const chip = statusChips[word];
  return <span className={`mx-0.5 inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 align-middle text-xs font-medium leading-5 ${chip.className}`}>{chip.label}</span>;
}
