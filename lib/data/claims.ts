import { createClient } from "@/lib/supabase/server";
import type { Claim, ClaimStatus } from "./types";

export async function listClaims(filters: { status?: string; department?: string } = {}): Promise<Claim[]> {
  const supabase = await createClient();
  let query = supabase
    .from("claims")
    .select("*, department:departments(*), claim_items(*)")
    .order("created_at", { ascending: false });
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.department) query = query.eq("department_id", filters.department);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load claims: ${error.message}`);
  return (data ?? []) as unknown as Claim[];
}

export async function getClaimById(id: string): Promise<Claim | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("claims")
    .select("*, department:departments(*), claim_items(*), approvals(*), payments(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load claim: ${error.message}`);
  if (!data) return null;
  return data as unknown as Claim;
}

export async function getClaimCounts(): Promise<Record<ClaimStatus, number>> {
  const claims = await listClaims();
  return claims.reduce<Record<ClaimStatus, number>>((counts, claim) => {
    counts[claim.status] += 1;
    return counts;
  }, { draft: 0, submitted: 0, classified: 0, approved: 0, rejected: 0, paid: 0 });
}
