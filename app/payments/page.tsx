import Link from "next/link";
import { releasePaymentAction } from "@/lib/actions/claim-actions";
import { listPaymentClaims } from "@/lib/data/payments";
import { currentUserHasRole } from "@/lib/data/roles";

const money = (amount: number, currency = "MYR") => new Intl.NumberFormat("en-MY", { style: "currency", currency }).format(Number(amount));
const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const [claims, notices, isFinance] = await Promise.all([listPaymentClaims(), searchParams, currentUserHasRole("finance")]);
  const ready = claims.filter((claim) => claim.status === "approved");
  const released = claims.filter((claim) => claim.status === "paid");
  return (
    <>
      <div className="page-kicker">Workspace / Payments</div>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div><h1 className="page-title">Every release, accounted for.</h1><p className="page-subtitle">Record a reference when Finance sends an approved claim.</p></div>
        <div className="flex gap-5 text-xs"><div><div className="text-[10px] text-slate-400">Ready to release</div><div className="mt-1 text-lg font-bold">{ready.length}</div></div><div><div className="text-[10px] text-slate-400">Released</div><div className="mt-1 text-lg font-bold">{released.length}</div></div></div>
      </div>
      {notices.error && <div role="alert" className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 error-text">{notices.error}</div>}
      {notices.success && <div role="status" className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 success-text">{notices.success}</div>}

      {ready.length > 0 && <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3"><div><div className="page-kicker">Approved claims</div><h2 className="mt-1 text-lg font-semibold">Ready for release</h2></div><span className="text-[10px] text-slate-400">{ready.length} waiting</span></div>
        <div className="space-y-3">{ready.map((claim) => <article key={claim.id} className="panel grid gap-4 p-5 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <div className="min-w-0"><Link className="page-kicker hover:underline" href={`/claims/${claim.id}`}>{claim.voucher_number}</Link><h3 className="mt-1 truncate text-sm font-bold">{claim.title}</h3><p className="mt-1 text-[11px] text-slate-500">{claim.department?.name ?? "No department"} · approved {dateLabel(claim.approved_at)}</p><div className="mt-3 text-lg font-semibold tabular-nums">{money(claim.amount, claim.currency)}</div></div>
          {isFinance ? <form action={releasePaymentAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <input type="hidden" name="claim_id" value={claim.id} />
            <label><span className="field-label">Payment method</span><select className="select" name="method" defaultValue="bank_transfer" required><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option><option value="cheque">Cheque</option></select></label>
            <label><span className="field-label">Payment reference</span><input className="field" name="reference" placeholder="e.g. BNI-12345" required maxLength={80} /></label>
            <button className="button button-primary" type="submit">Release payment</button>
          </form> : <p className="text-xs text-slate-500">Awaiting Finance to record the payment release.</p>}
        </article>)}</div>
      </section>}

      <section className="mt-9">
        <div className="mb-3 flex items-end justify-between gap-3"><div><div className="page-kicker">Payment history</div><h2 className="mt-1 text-lg font-semibold">Released payments</h2></div><span className="text-[10px] text-slate-400">{released.length} records</span></div>
        <div className="panel overflow-hidden">
          {released.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Voucher</th><th>Claim</th><th>Department</th><th>Method</th><th>Reference</th><th>Released</th><th className="text-right">Amount</th></tr></thead><tbody>{released.flatMap((claim) => (claim.payments ?? []).filter((payment) => payment.status === "released").map((payment) => <tr key={payment.id}><td><Link className="font-semibold text-[#24594d] hover:underline" href={`/claims/${claim.id}`}>{claim.voucher_number}</Link></td><td className="font-medium">{claim.title}</td><td>{claim.department?.name ?? "—"}</td><td className="capitalize">{payment.method?.replace("_", " ") ?? "—"}</td><td className="font-semibold">{payment.reference ?? "—"}</td><td className="whitespace-nowrap text-slate-500">{dateLabel(payment.paid_at)}</td><td className="text-right font-semibold tabular-nums">{money(payment.amount, claim.currency)}</td></tr>))}</tbody></table></div> : ready.length === 0 ? <div className="empty-state"><div className="empty-mark">↗</div><h2 className="empty-title">No payments yet.</h2><p className="empty-copy">Approved claims will appear here when they are ready for release.</p><Link href="/claims" className="button button-light">View claims</Link></div> : <div className="px-5 py-4 text-xs text-slate-500">No payments have been released yet.</div>}
        </div>
      </section>
    </>
  );
}
