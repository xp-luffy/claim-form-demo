import Link from "next/link";
import { listAuditEvents } from "@/lib/data/audit";
import { listClaims } from "@/lib/data/claims";

const actionLabels: Record<string, string> = { submit: "Claim submitted", classify: "Classified", approve: "Approved", reject: "Rejected", release: "Payment released" };
const dateLabel = (value: string) => new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ claim_id?: string }> }) {
  const params = await searchParams;
  const [claims, events] = await Promise.all([listClaims(), listAuditEvents(params.claim_id)]);
  return (
    <>
      <div className="page-kicker">Workspace / Activity</div>
      <div className="flex flex-wrap items-end justify-between gap-5"><div><h1 className="page-title">A record of every decision.</h1><p className="page-subtitle">Submission, classification, approval, rejection, and payment release events.</p></div><span className="status-pill status-classified">Latest {events.length} events</span></div>
      <form method="get" className="panel mt-7 flex flex-wrap items-end gap-3 p-4 sm:p-5">
        <label className="min-w-[220px] flex-1"><span className="field-label">Filter by claim</span><select className="select" name="claim_id" defaultValue={params.claim_id ?? ""}><option value="">All claims</option>{claims.map((claim) => <option key={claim.id} value={claim.id}>{claim.voucher_number} · {claim.title}</option>)}</select></label>
        <button className="button button-primary" type="submit">Apply filter</button>{params.claim_id && <Link className="button button-light" href="/audit">Clear filter</Link>}
      </form>
      <section className="panel mt-5 overflow-hidden">
        {events.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>When</th><th>Claim</th><th>Event</th><th>Details</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td className="whitespace-nowrap text-slate-500">{dateLabel(event.created_at)}</td><td><Link href={`/claims/${event.entity_id}`} className="font-semibold text-[#24594d] hover:underline">{event.voucher_number ?? "Claim"}</Link><div className="mt-1 text-[10px] text-slate-500">{event.claim_title}</div></td><td><span className="status-pill status-classified">{actionLabels[event.action] ?? event.action}</span></td><td className="max-w-xl text-slate-600">{event.detail ? (() => { try { const detail = JSON.parse(event.detail); return detail.category ? `${detail.category}${detail.is_petty_cash ? " · petty cash" : ""}` : detail.reference ? `${detail.method?.replace("_", " ")} · ${detail.reference}` : detail.note || "Recorded."; } catch { return event.detail; } })() : "Recorded."}</td></tr>)}</tbody></table></div> : <div className="empty-state"><div className="empty-mark">◷</div><h2 className="empty-title">No activity found.</h2><p className="empty-copy">Try a different claim or clear the filter.</p>{params.claim_id && <Link href="/audit" className="button button-light">Clear filter</Link>}</div>}
      </section>
    </>
  );
}
