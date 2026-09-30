import Link from "next/link";
import { listClaims } from "@/lib/data/claims";
import { listDepartments } from "@/lib/data/departments";
import type { ClaimStatus } from "@/lib/data/types";

const filters: { id: string; label: string }[] = [
  { id: "all", label: "All claims" },
  { id: "submitted", label: "Submitted" },
  { id: "classified", label: "Classified" },
  { id: "approved", label: "Approved" },
  { id: "paid", label: "Paid" },
  { id: "rejected", label: "Rejected" },
];

function money(amount: number, currency = "MYR") {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency }).format(Number(amount));
}

function dateLabel(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "—";
}

export default async function ClaimsPage({ searchParams }: { searchParams: Promise<{ status?: string; department?: string }> }) {
  const params = await searchParams;
  const [claims, departments] = await Promise.all([
    listClaims({ status: params.status, department: params.department }),
    listDepartments(),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="page-kicker">Workspace / Claims</div>
          <h1 className="page-title">A clear view of every claim.</h1>
          <p className="page-subtitle">Follow submissions from first receipt through reimbursement.</p>
        </div>
        <Link href="/claims/new" className="button button-primary">+ New claim</Link>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe5e1]">
        <nav className="-mb-px flex flex-wrap gap-1" aria-label="Filter claims by status">
          {filters.map((filter) => {
            const href = new URLSearchParams();
            if (filter.id !== "all") href.set("status", filter.id);
            if (params.department) href.set("department", params.department);
            const active = (params.status ?? "all") === filter.id;
            return <Link key={filter.id} className={`border-b-2 px-3 py-3 text-[11px] font-semibold ${active ? "border-[#24594d] text-[#24594d]" : "border-transparent text-slate-500 hover:text-slate-800"}`} href={`/claims${href.size ? `?${href}` : ""}`} aria-current={active ? "page" : undefined}>{filter.label}</Link>;
          })}
        </nav>
        <form method="get" className="flex items-center gap-2 pb-2">
          {params.status && <input type="hidden" name="status" value={params.status} />}
          <label className="sr-only" htmlFor="department-filter">Filter by department</label>
          <select id="department-filter" name="department" defaultValue={params.department ?? ""} className="rounded-md border border-[#e1e6e2] bg-white px-2.5 py-2 text-[10px] text-slate-600">
            <option value="">All departments</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </select>
          <button className="button button-light !min-h-[34px] !px-3 !text-[10px]" type="submit">Filter</button>
        </form>
      </div>

      <div className="panel mt-4 overflow-hidden">
        {claims.length ? <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Voucher</th><th>Claim</th><th>Department</th><th>Submitted</th><th>Amount</th><th>Status</th><th /></tr></thead>
          <tbody>{claims.map((claim) => (
            <tr key={claim.id}>
              <td><Link href={`/claims/${claim.id}`} className="font-semibold text-[#24594d] hover:underline">{claim.voucher_number ?? "Pending"}</Link></td>
              <td><Link href={`/claims/${claim.id}`} className="font-semibold hover:text-[#24594d]">{claim.title}</Link><div className="mt-1 text-[10px] capitalize text-slate-400">{claim.claim_type.replace("_", " ")}</div></td>
              <td className="text-slate-600">{claim.department?.name ?? "—"}</td>
              <td className="whitespace-nowrap text-slate-500">{dateLabel(claim.submitted_at)}</td>
              <td className="whitespace-nowrap font-semibold tabular-nums">{money(claim.amount, claim.currency)}</td>
              <td><span className={`status-pill status-${claim.status as ClaimStatus}`}>{claim.status}</span></td>
              <td><Link href={`/claims/${claim.id}`} className="text-slate-400 hover:text-[#24594d]" aria-label={`View ${claim.title}`}>→</Link></td>
            </tr>
          ))}</tbody>
        </table></div> : <div className="empty-state">
          <div className="empty-mark">▤</div>
          <h2 className="empty-title">No claims yet.</h2>
          <p className="empty-copy">Create your first claim and keep the paperwork out of your way.</p>
          <Link href="/claims/new" className="button button-primary">Create a claim <span aria-hidden="true">→</span></Link>
        </div>}
      </div>
      <p className="mt-3 text-right text-[10px] text-slate-400">{claims.length} {claims.length === 1 ? "claim" : "claims"} shown</p>
    </>
  );
}
