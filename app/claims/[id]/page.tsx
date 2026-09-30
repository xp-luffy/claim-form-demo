import Link from "next/link";
import { notFound } from "next/navigation";
import { approveClaimAction, classifyClaimAction, rejectClaimAction } from "@/lib/actions/claim-actions";
import { listClaimAudit } from "@/lib/data/audit";
import { getClaimById } from "@/lib/data/claims";
import { currentUserRoles } from "@/lib/data/roles";

const money = (amount: number, currency = "MYR") => new Intl.NumberFormat("en-MY", { style: "currency", currency }).format(Number(amount));
const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not yet";
const successLabels: Record<string, string> = { classified: "Claim classified and ready for approval.", approved: "Claim approved and ready for payment.", rejected: "Claim rejected." };
const actionLabels: Record<string, string> = { submit: "Claim submitted", classify: "Claim classified", approve: "Claim approved", reject: "Claim rejected", release: "Payment released" };

export default async function ClaimDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; success?: string }> }) {
  const [{ id }, notices] = await Promise.all([params, searchParams]);
  const [claim, audit, roles] = await Promise.all([getClaimById(id), listClaimAudit(id), currentUserRoles()]);
  if (!claim) notFound();

  const payment = claim.payments?.find((record) => record.status === "released");
  const success = notices.success ? successLabels[notices.success] : undefined;

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
      {notices.error && <div role="alert" className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 error-text">{notices.error}</div>}
      {success && <div role="status" className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 success-text">{success}</div>}

      <div className="mt-7 grid gap-4 lg:grid-cols-[1.55fr_.85fr]">
        <div className="space-y-4">
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

          {claim.status === "submitted" && claim.suggested_category && <section className="panel border-[#d8e8e1] bg-[#f4f8f5] p-5 sm:p-6">
            <div className="page-kicker">AI suggestion · Review required</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-2"><h2 className="text-base font-bold">{claim.suggested_category}</h2><span className="text-[11px] font-medium text-slate-500">{claim.suggested_category_confidence === null ? "Confidence unavailable" : `${Math.round(claim.suggested_category_confidence * 100)}% confidence`}</span></div>
            <p className="mt-1 text-xs text-slate-500">Suggested by {claim.suggested_category_source ?? "AI"}. Finance reviews and confirms or changes this category.</p>
          </section>}

          {claim.status === "submitted" && roles.includes("finance") && <section className="panel p-5 sm:p-6">
            <div className="mb-4"><div className="page-kicker">Finance review</div><h2 className="mt-1 text-base font-bold">Classify this claim</h2><p className="mt-1 text-xs text-slate-500">Choose a category for the expense lines and confirm whether this is petty cash.</p></div>
            <form action={classifyClaimAction} className="space-y-4">
              <input type="hidden" name="claim_id" value={claim.id} />
              <label><span className="field-label">Category</span><input className="field" name="category" placeholder="e.g. Stationery" defaultValue={claim.suggested_category ?? claim.claim_items?.find((item) => item.category)?.category ?? ""} required maxLength={80} /></label>
              <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-600"><input name="is_petty_cash" type="checkbox" defaultChecked={claim.is_petty_cash} className="size-4 accent-[#24594d]" />Confirm petty-cash claim</label>
              <button className="button button-primary" type="submit">Classify claim <span aria-hidden="true">→</span></button>
            </form>
          </section>}

          {claim.status === "submitted" && !roles.includes("finance") && <section className="panel p-5 sm:p-6"><div className="page-kicker">Awaiting finance review</div><h2 className="mt-1 text-base font-bold">Your claim is in review.</h2><p className="mt-1 text-xs text-slate-500">Finance will confirm the category before it moves to approval.</p></section>}

          {claim.status === "classified" && roles.includes("approver") && <section className="panel p-5 sm:p-6">
            <div className="page-kicker">Approver review</div><h2 className="mt-1 text-base font-bold">Make a decision</h2><p className="mt-1 text-xs text-slate-500">Approve to send this to Finance, or reject it with a note.</p>
            <form className="mt-4" action={approveClaimAction}>
              <input type="hidden" name="claim_id" value={claim.id} />
              <label className="block"><span className="field-label">Decision note</span><textarea className="textarea" name="note" placeholder="A short note for the claimant" maxLength={500} /></label>
              <div className="mt-3 flex flex-wrap gap-2"><button className="button button-primary" type="submit">Approve claim <span aria-hidden="true">→</span></button><button className="button button-danger" type="submit" formAction={rejectClaimAction}>Reject claim</button></div>
            </form>
          </section>}

          {claim.status === "classified" && !roles.includes("approver") && <section className="panel p-5 sm:p-6"><div className="page-kicker">Awaiting approval</div><h2 className="mt-1 text-base font-bold">Your claim is ready for approval.</h2><p className="mt-1 text-xs text-slate-500">An approver will review the classified claim.</p></section>}

          {payment && <section className="panel p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3"><div><div className="page-kicker">Payment released</div><h2 className="mt-1 text-base font-bold">{payment.reference}</h2></div><span className="status-pill status-paid">Paid</span></div>
            <div className="mt-4 grid gap-3 border-t border-[#eef0ee] pt-4 sm:grid-cols-3"><div><div className="field-label">Amount</div><div className="text-sm font-bold">{money(payment.amount, claim.currency)}</div></div><div><div className="field-label">Method</div><div className="text-sm font-semibold capitalize">{payment.method?.replace("_", " ")}</div></div><div><div className="field-label">Released</div><div className="text-xs font-semibold">{dateLabel(payment.paid_at)}</div></div></div>
          </section>}

          <section className="panel p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-2"><div><div className="page-kicker">Record</div><h2 className="mt-1 text-base font-bold">Claim timeline</h2></div><span className="text-[10px] text-slate-400">{audit.length} {audit.length === 1 ? "event" : "events"}</span></div>
            {audit.length ? <ol className="mt-5 space-y-4">{audit.map((entry, index) => <li key={entry.id} className="flex gap-3">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#e8f1ed] text-[11px] font-bold text-[#24594d]">{index + 1}</span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold capitalize">{actionLabels[entry.action] ?? entry.action}</span><time className="text-[10px] text-slate-400">{dateLabel(entry.created_at)}</time></div><p className="mt-1 break-words text-[11px] leading-5 text-slate-500">{entry.detail ? (() => { try { const detail = JSON.parse(entry.detail); return detail.category ? `Category set to ${detail.category}${detail.is_petty_cash ? " · petty cash confirmed" : ""}` : detail.reference ? `Released via ${detail.method?.replace("_", " ")} · reference ${detail.reference}` : detail.note || "Saved to the claim record."; } catch { return entry.detail; } })() : "Saved to the claim record."}</p></div>
            </li>)}</ol> : <p className="mt-4 text-xs text-slate-500">No events recorded yet.</p>}
          </section>
        </div>

        <aside className="panel h-fit p-5 sm:p-6">
          <h2 className="text-sm font-bold">Claim summary</h2>
          <dl className="mt-5 space-y-4 text-xs">
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Claim type</dt><dd className="font-semibold capitalize">{claim.claim_type.replace("_", " ")}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Petty cash</dt><dd className="font-semibold">{claim.is_petty_cash ? "Yes" : "No"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Submitted</dt><dd className="text-right font-semibold">{dateLabel(claim.submitted_at)}</dd></div>
            <div className="flex justify-between gap-4 border-t border-[#eef0ee] pt-4"><dt className="text-slate-500">Total claim</dt><dd className="font-bold">{money(claim.amount, claim.currency)}</dd></div>
            {claim.status === "approved" && <div className="rounded-lg bg-amber-50 p-3 text-[11px] leading-5 text-amber-800">Ready for Finance to record a payment release.</div>}
            {claim.status === "rejected" && <div className="rounded-lg bg-red-50 p-3 text-[11px] leading-5 text-red-700">This claim was rejected. Review the timeline for the decision note.</div>}
          </dl>
        </aside>
      </div>
    </>
  );
}
