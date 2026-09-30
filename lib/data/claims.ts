import { createClient } from "@/lib/supabase/server";
import { suggestClaimCategory } from "@/lib/ai/classify";
import type { Claim, ClaimStatus } from "./types";

export async function listClaims(filters: { status?: string; department?: string; sort?: string } = {}): Promise<Claim[]> {
  const supabase = await createClient();
  let query = supabase
    .from("claims")
    .select("*, department:departments(*), claim_items(*)")
    .order("created_at", { ascending: false });
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.department) query = query.eq("department_id", filters.department);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load claims: ${error.message}`);
  const claims = (data ?? []) as unknown as Claim[];
  if (filters.sort === "amount_desc") claims.sort((a, b) => Number(b.amount) - Number(a.amount));
  else if (filters.sort === "oldest") claims.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  else if (filters.sort !== "newest") {
    const priority: Record<ClaimStatus, number> = { submitted: 0, classified: 1, approved: 2, draft: 3, rejected: 4, paid: 5 };
    claims.sort((a, b) => priority[a.status] - priority[b.status] || Date.parse(b.created_at) - Date.parse(a.created_at));
  }
  return claims;
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

export async function submitClaimRecord(input: {
  title: string;
  description: string | null;
  departmentId: string;
  claimType: Claim["claim_type"];
  isPettyCash: boolean;
  items: Array<{ description: string; amount: number }>;
}): Promise<string> {
  const supabase = await createClient();
  const suggestion = await suggestClaimCategory(input);
  const { data: claimId, error } = await supabase.rpc("submit_claim", {
    p_department_id: input.departmentId,
    p_claim_type: input.claimType,
    p_title: input.title,
    p_description: input.description,
    p_is_petty_cash: input.isPettyCash,
    p_items: input.items,
  });
  if (error || !claimId) throw new Error(`Could not save claim. ${error?.message ?? "Please try again."}`);

  if (suggestion?.category && suggestion.confidence !== null) {
    const { error: suggestionError } = await supabase.rpc("save_claim_suggestion", {
      p_claim_id: claimId,
      p_category: suggestion.category,
      p_confidence: suggestion.confidence,
      p_source: suggestion.source,
    });
    if (suggestionError) console.error("Could not save the optional category suggestion", suggestionError.message);
  }
  return claimId;
}

export async function classifyClaimRecord(claimId: string, category: string, isPettyCash: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("classify_claim", { p_claim_id: claimId, p_category: category, p_is_petty_cash: isPettyCash });
  if (error) throw new Error(`Could not classify this claim: ${error.message}`);
}

export async function decideClaimRecord(claimId: string, decision: "approved" | "rejected", note: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_claim", { p_claim_id: claimId, p_decision: decision, p_note: note });
  if (error) throw new Error(`Could not save this decision: ${error.message}`);
}

export async function releaseClaimPaymentRecord(claimId: string, method: "bank_transfer" | "cash" | "cheque", reference: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("release_claim_payment", { p_claim_id: claimId, p_method: method, p_reference: reference });
  if (error) throw new Error(`Could not save the payment: ${error.message}`);
}
