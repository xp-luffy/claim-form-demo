import Link from "next/link";
import { notFound } from "next/navigation";
import { getClaimById } from "@/lib/data/claims";

const money = (amount: number, currency = "MYR") => new Intl.NumberFormat("en-MY", { style: "currency", currency }).format(Number(amount));
const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

export default async function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const claim = await getClaimById(id);
  if (!claim) notFound();

  return (
    <>
      <div className="page-kicker"><Link href="/claims" className="hover:underline">Claims</Link> / {claim.voucher_number}</div>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className={`status-pill status-${claim.status}`}>{claim.status}</span>
          <h1 className="page-title !mt-3">{claim.title}</h1>
          <p className="page-subtitle">{claim.voucher_number} <span className="px-1.5 text-slate-300">·</span> {claim.department?.name ?? "No department"}</p>
        </div>
        <Link href="/claims" className="button button-light">← All claims</Link>
      </div>

      <div className="mt-7 grid gap-4 lg:grid-cols-[1.55fr_.85fr]">
        <section className="panel overflow-hidden">
          <div className="border-b border-[#eef0ee] px-5 py-4 sm:px-7">
            <h2 className="text-sm font-bold">Claim details</h2>
            {claim.description && <p className="mt-1.5 text-xs leading-6 text-slate-500">{claim.description}</p>}
          </div>
          <div className="table-wrap"><table className="data-table">
            <thead><tr><th>Expense</th><th>Category</th><th className="text-right">Amount</th></tr></thead>
            <tbody>{claim.claim_items?.map((item) => <tr key={item.id ?? item.description}>
              <td className="font-medium">{item.description}</td><td className="text-slate-500">{item.category ?? "—"}</td><td className="text-right font-semibold tabular-nums">{money(item.amount, claim.currency)}</td>
            </tr>)}</tbody>
            <tfoot><tr><td colSpan={2} className="text-right text-[11px] font-semibold text-slate-500">Total</td><td className="text-right font-bold tabular-nums">{money(claim.amount, claim.currency)}</td></tr></tfoot>
          </table></div>
        </section>
        <aside className="panel p-5 sm:p-6">
          <h2 className="text-sm font-bold">Claim summary</h2>
          <dl className="mt-5 space-y-4 text-xs">
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Claim type</dt><dd className="font-semibold capitalize">{claim.claim_type.replace("_", " ")}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Petty cash</dt><dd className="font-semibold">{claim.is_petty_cash ? "Yes" : "No"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Submitted</dt><dd className="text-right font-semibold">{dateLabel(claim.submitted_at)}</dd></div>
            <div className="flex justify-between gap-4 border-t border-[#eef0ee] pt-4"><dt className="text-slate-500">Total claim</dt><dd className="font-bold">{money(claim.amount, claim.currency)}</dd></div>
          </dl>
          <div className="mt-6 rounded-lg bg-[#f5f8f6] p-3 text-[11px] leading-5 text-slate-600">Your voucher is ready. The review and payment steps will appear here as the claim moves forward.</div>
        </aside>
      </div>
    </>
  );
}
