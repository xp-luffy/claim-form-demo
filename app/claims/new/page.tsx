import Link from "next/link";
import { NewClaimForm } from "@/components/claims/new-claim-form";
import { listDepartments } from "@/lib/data/departments";

export default async function NewClaimPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, departments] = await Promise.all([searchParams, listDepartments()]);
  return (
    <>
      <div className="page-kicker"><Link href="/claims" className="hover:underline">Claims</Link> / New claim</div>
      <h1 className="page-title">Start a new claim.</h1>
      <p className="page-subtitle">A few details help the right people review and reimburse you.</p>
      {error && <div role="alert" className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 error-text">{error}</div>}
      <NewClaimForm departments={departments} />
    </>
  );
}
