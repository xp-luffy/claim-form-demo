import { createDepartmentAction, updateDepartmentAction } from "@/lib/actions/claim-actions";
import { getDepartmentClaimCounts } from "@/lib/data/dashboard";
import { listDepartments } from "@/lib/data/departments";
import { currentUserHasRole } from "@/lib/data/roles";

export default async function DepartmentsPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const [departments, counts, notices, isFinance] = await Promise.all([listDepartments(), getDepartmentClaimCounts(), searchParams, currentUserHasRole("finance")]);
  return (
    <>
      <div className="page-kicker">Workspace / Departments</div>
      <div className="flex flex-wrap items-end justify-between gap-5"><div><h1 className="page-title">Teams, kept in view.</h1><p className="page-subtitle">Manage the departments people can tag when they submit a claim.</p></div><span className="status-pill status-classified">{departments.length} active departments</span></div>
      {notices.error && <div role="alert" className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 error-text">{notices.error}</div>}
      {notices.success && <div role="status" className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 success-text">{notices.success}</div>}

      {isFinance && <section className="panel mt-7 p-5 sm:p-6">
        <div><div className="page-kicker">Add a team</div><h2 className="mt-1 text-base font-semibold">New department</h2></div>
        <form action={createDepartmentAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
          <label><span className="field-label">Department name</span><input className="field" name="name" placeholder="e.g. Customer Support" required maxLength={80} /></label>
          <label><span className="field-label">Short code</span><input className="field uppercase" name="code" placeholder="e.g. CS" required minLength={2} maxLength={8} pattern="[A-Za-z0-9_-]{2,8}" title="Use 2–8 letters, numbers, dashes, or underscores" /></label>
          <button className="button button-primary" type="submit">Add department</button>
        </form>
      </section>}
      {!isFinance && <p className="mt-7 text-xs text-slate-500">Only Finance can add or edit departments. Everyone signed in can view the directory.</p>}

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><div className="page-kicker">Department directory</div><h2 className="mt-1 text-lg font-semibold">Current departments</h2></div><p className="text-[10px] text-slate-400">Changes apply to new claims; existing claim records remain attached.</p></div>
        <div className="panel overflow-hidden">
          {departments.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Department</th><th>Code</th><th>Claims</th>{isFinance && <th>Save changes</th>}</tr></thead><tbody>{departments.map((department) => { const formId = `update-${department.id}`; return <tr key={department.id}>
            {isFinance ? <>
              <td><form id={formId} action={updateDepartmentAction}><input type="hidden" name="department_id" value={department.id} /></form><label><span className="sr-only">Department name for {department.code}</span><input form={formId} className="field !min-h-[36px]" name="name" defaultValue={department.name} required maxLength={80} /></label></td>
              <td><label><span className="sr-only">Department code for {department.name}</span><input form={formId} className="field !min-h-[36px] uppercase" name="code" defaultValue={department.code} required minLength={2} maxLength={8} pattern="[A-Za-z0-9_-]{2,8}" /></label></td>
            </> : <><td className="font-medium">{department.name}</td><td>{department.code}</td></>}
            <td className="text-center text-xs tabular-nums text-slate-500">{counts[department.id] ?? 0}</td>
            {isFinance && <td><button form={formId} className="button button-light !min-h-[36px] !px-3 !text-[10px]" type="submit">Save</button></td>}
          </tr>; })}</tbody></table></div> : <div className="empty-state"><h2 className="empty-title">No departments yet.</h2><p className="empty-copy">Add a department so staff can tag their submissions.</p></div>}
        </div>
      </section>
    </>
  );
}
