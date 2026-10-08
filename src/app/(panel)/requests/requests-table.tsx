"use client";

import { useState } from "react";
import { approvePurchaseAction } from "@/app/actions";
import { ColumnFilter } from "@/components/column-filter";
import { Modal } from "@/components/modal";
import { SubmitButton } from "@/components/ui";
import { RejectForm } from "./reject-form";

export type RequestRow = {
  id: string;
  subject: string;
  shopName: string;
  domain: string;
  amount: string;
  method: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "AWAITING_PAYMENT" | "FAILED";
  statusLabel: string;
  statusClass: string;
  createdAt: string;
  /** What the modal lists, label by value; `ltr` marks codes and addresses that read left to right. */
  details: Array<{ label: string; value: string; ltr?: boolean }>;
  note: string | null;
  rejectReason: string | null;
};

/** The requests table; pressing a row opens its details in a dialog, with approve and reject for a pending one. */
export function RequestsTable({ rows }: { rows: RequestRow[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rows.find((row) => row.id === selectedId) ?? null;

  return (
    <>
      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[56rem] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium"><span className="inline-flex items-center gap-1">قابلیت / بسته<ColumnFilter param="q" label="قابلیت یا بسته" /></span></th>
              <th className="px-4 py-3 text-start font-medium">نام سایت</th>
              <th className="px-4 py-3 text-start font-medium">دامنه</th>
              <th className="px-4 py-3 text-start font-medium">مبلغ</th>
              <th className="px-4 py-3 text-start font-medium"><span className="inline-flex items-center gap-1">روش<ColumnFilter param="method" label="روش" options={[{ value: "ONLINE", label: "آنلاین" }, { value: "CARD_TO_CARD", label: "کارت‌به‌کارت" }]} /></span></th>
              <th className="px-4 py-3 text-start font-medium"><span className="inline-flex items-center gap-1">وضعیت<ColumnFilter param="status" label="وضعیت" options={[{ value: "PENDING", label: "در انتظار" }, { value: "APPROVED", label: "تأیید شده" }, { value: "REJECTED", label: "رد شده" }]} /></span></th>
              <th className="px-4 py-3 text-start font-medium">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">درخواستی پیدا نشد.</td></tr>}
            {rows.map((row) => (
              <tr
                key={row.id}
                tabIndex={0}
                onClick={() => setSelectedId(row.id)}
                onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setSelectedId(row.id); } }}
                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-bold">{row.subject}</td>
                <td className="px-4 py-3">{row.shopName}</td>
                <td className="px-4 py-3 text-slate-600"><span dir="ltr" className="inline-block">{row.domain}</span></td>
                <td className="px-4 py-3">{row.amount}</td>
                <td className="px-4 py-3 text-slate-600">{row.method}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-medium ${row.statusClass}`}>{row.statusLabel}</span></td>
                <td className="px-4 py-3 text-slate-500">{row.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={selected !== null} title={selected ? selected.subject : ""} onClose={() => setSelectedId(null)}>
        {selected && (
          <div className="space-y-4">
            <div className="flex justify-end"><span className={`rounded-full px-3 py-1 text-xs font-medium ${selected.statusClass}`}>{selected.statusLabel}</span></div>

            <dl className="m-0 divide-y divide-slate-100 rounded-xl border border-slate-100">
              {selected.details.map((detail) => (
                <div key={detail.label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-slate-500">{detail.label}</dt>
                  <dd className="m-0 font-medium">{detail.ltr ? <code dir="ltr">{detail.value}</code> : detail.value}</dd>
                </div>
              ))}
            </dl>

            {selected.note && (
              <div className="text-sm">
                <p className="m-0 mb-1 text-slate-500">توضیح مشتری</p>
                <p className="m-0 leading-7">{selected.note}</p>
              </div>
            )}

            {selected.status === "REJECTED" && selected.rejectReason && (
              <div className="text-sm text-red-700">
                <p className="m-0 mb-1">دلیل رد</p>
                <p className="m-0 leading-7">{selected.rejectReason}</p>
              </div>
            )}

            {selected.status === "PENDING" && (
              <div className="flex flex-wrap items-start gap-3 border-t border-slate-100 pt-4">
                <form action={approvePurchaseAction.bind(null, selected.id)}><SubmitButton>تأیید و فعال‌سازی</SubmitButton></form>
                <RejectForm requestId={selected.id} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
