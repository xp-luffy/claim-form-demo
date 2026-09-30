import { listClaims } from "./claims";
import type { Claim, ClaimStatus } from "./types";

export async function getDashboardSummary() {
  const claims = await listClaims();
  const counts = claims.reduce<Record<ClaimStatus, number>>((total, claim) => {
    total[claim.status] += 1;
    return total;
  }, { draft: 0, submitted: 0, classified: 0, approved: 0, rejected: 0, paid: 0 });
  const pendingAmount = claims.filter((claim) => ["submitted", "classified", "approved"].includes(claim.status)).reduce((sum, claim) => sum + Number(claim.amount), 0);
  const paidAmount = claims.filter((claim) => claim.status === "paid").reduce((sum, claim) => sum + Number(claim.amount), 0);
  const recent = [...claims].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 5);
  return { claims, counts, pendingAmount, paidAmount, recent };
}

export async function getDepartmentClaimCounts() {
  const claims = await listClaims();
  return claims.reduce<Record<string, number>>((counts, claim: Claim) => {
    if (claim.department_id) counts[claim.department_id] = (counts[claim.department_id] ?? 0) + 1;
    return counts;
  }, {});
}
