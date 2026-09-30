import Link from "next/link";
import { getDashboardSummary } from "@/lib/data/dashboard";

const money = (amount: number) => new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(amount);
const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short" }).format(new Date(value)) : "—";

const statusRows = [
  { label: "Needs review", status: "submitted", color: "#b98632" },
  { label: "Classified", status: "classified", color: "#5581a5" },
  { label: "Approved", status: "approved", color: "#64836d" },
  { label: "Paid", status: "paid", color: "#378469" },
  { label: "Rejected", status: "rejected", color: "#ae4b47" },
];

export default async function DashboardPage() {
  const summary = await getDashboardSummary();
  const openCount = summary.counts.submitted + summary.counts.classified + summary.counts.approved;
  const today = new Intl.DateTimeFormat("en-MY", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div><div className="page-kicker">{today}</div><h1 className="page-title">Good morning.</h1><p className="page-subtitle">Here’s how your team’s claims are moving today.</p></div>
        <Link className="button button-primary" href="/claims/new">+ New claim</Link>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel p-5"><div className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">Open claims</div><div className="mt-3 text-3xl font-semibold tracking-tight">{openCount}</div><div className="mt-2 text-[11px] text-slate-500">Across review and payment steps</div></div>
        <div className="panel p-5"><div className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">Waiting for review</div><div className="mt-3 text-3xl font-semibold tracking-tight">{summary.counts.submitted + summary.counts.classified}</div><div className="mt-2 text-[11px] text-slate-500">Submitted or awaiting approval</div></div>
        <div className="panel p-5"><div className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">Pending amount</div><div className="mt-3 text-3xl font-semibold tracking-tight">{money(summary.pendingAmount)}</div><div className="mt-2 text-[11px] text-slate-500">Approved and awaiting release included</div></div>
        <div className="panel p-5"><div className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">Paid to date</div><div className="mt-3 text-3xl font-semibold tracking-tight">{money(summary.paidAmount)}</div><div className="mt-2 text-[11px] text-slate-500">Across {summary.counts.paid} released {summary.counts.paid === 1 ? "claim" : "claims"}</div></div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6"><div><div className="page-kicker">Latest activity</div><h2 className="mt-1 text-base font-semibold">Recent claims</h2></div><Link className="text-[11px] font-bold text-[#24594d] hover:underline" href="/claims">View all →</Link></div>
          {summary.recent.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Voucher</th><th>Claim</th><th>Department</th><th>Date</th><th>Status</th></tr></thead><tbody>{summary.recent.map((claim) => <tr key={claim.id}><td><Link href={`/claims/${claim.id}`} className="font-semibold text-[#24594d] hover:underline">{claim.voucher_number}</Link></td><td className="font-medium">{claim.title}</td><td>{claim.department?.name ?? "—"}</td><td className="whitespace-nowrap text-slate-500">{dateLabel(claim.submitted_at)}</td><td><span className={`status-pill status-${claim.status}`}>{claim.status}</span></td></tr>)}</tbody></table></div> : <div className="empty-state !py-9"><div className="empty-mark">▤</div><h2 className="empty-title">No claims to show yet.</h2><p className="empty-copy">Your team’s submissions will appear here.</p><Link href="/claims/new" className="button button-primary">Create the first claim</Link></div>}
        </section>
        <section className="panel p-5 sm:p-6">
          <div className="page-kicker">At a glance</div><h2 className="mt-1 text-base font-semibold">Claim status</h2>
          <div className="mt-4 space-y-4">{statusRows.map((row) => {
            const count = summary.counts[row.status as keyof typeof summary.counts];
            const width = summary.claims.length ? `${Math.max(count ? 5 : 0, count / summary.claims.length * 100)}%` : "0%";
            return <Link key={row.status} href={`/claims?status=${row.status}`} className="block rounded-md py-1 hover:bg-[#f8faf8]">
              <div className="mb-1.5 flex items-center justify-between text-[11px]"><span className="font-semibold">{row.label}</span><span className="tabular-nums text-slate-500">{count}</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#eef1ee]"><div className="h-full rounded-full" style={{ width, background: row.color }} /></div>
            </Link>;
          })}</div>
          <div className="mt-6 border-t border-[#eef0ee] pt-4"><Link href="/audit" className="text-[11px] font-bold text-[#24594d] hover:underline">Open audit activity →</Link></div>
        </section>
      </div>
    </>
  );
}
