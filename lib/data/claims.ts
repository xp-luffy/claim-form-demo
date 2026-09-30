import { createClient } from "@/lib/supabase/server";
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
  const amount = Math.round(input.items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
  const { data: voucherNumber, error: voucherError } = await supabase.rpc("next_claim_voucher_number");
  if (voucherError || !voucherNumber) throw new Error("Could not assign a voucher number. Please try again.");
  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .insert({
      voucher_number: voucherNumber,
      department_id: input.departmentId,
      claim_type: input.claimType,
      title: input.title,
      description: input.description,
      amount,
      currency: "MYR",
      status: "submitted",
      is_petty_cash: input.isPettyCash,
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (claimError || !claim) throw new Error(`Could not save claim. ${claimError?.message ?? "Please try again."}`);

  const { error: itemsError } = await supabase.from("claim_items").insert(
    input.items.map((item) => ({ ...item, claim_id: claim.id })),
  );
  if (itemsError) {
    await supabase.from("claims").delete().eq("id", claim.id);
    throw new Error(`Could not save claim items. ${itemsError.message}`);
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    entity_type: "claim",
    entity_id: claim.id,
    action: "submit",
    detail: JSON.stringify({ tool: "submit_claim", voucher_number: voucherNumber, actor: "staff" }),
  });
  if (auditError) {
    await supabase.from("claims").delete().eq("id", claim.id);
    throw new Error(`Could not record the claim submission. ${auditError.message}`);
  }

  return claim.id;
}

async function writeAudit(supabase: Awaited<ReturnType<typeof createClient>>, claimId: string, action: string, detail: object) {
  const { error } = await supabase.from("audit_logs").insert({
    entity_type: "claim",
    entity_id: claimId,
    action,
    detail: JSON.stringify({ ...detail, actor: "staff" }),
  });
  if (error) throw new Error(`Could not record this change. ${error.message}`);
}

async function readClaimForTransition(claimId: string, requiredStatus: ClaimStatus) {
  const supabase = await createClient();
  const { data: claim, error } = await supabase.from("claims").select("id,status,is_petty_cash,amount").eq("id", claimId).maybeSingle();
  if (error) throw new Error(`Could not load claim: ${error.message}`);
  if (!claim) throw new Error("Claim not found.");
  if (claim.status !== requiredStatus) throw new Error(`Claim must be ${requiredStatus} before this action.`);
  return { supabase, claim };
}

export async function classifyClaimRecord(claimId: string, category: string, isPettyCash: boolean) {
  const { supabase, claim } = await readClaimForTransition(claimId, "submitted");
  const classifiedAt = new Date().toISOString();
  const { data: updated, error } = await supabase.from("claims").update({ status: "classified", is_petty_cash: isPettyCash, classified_at: classifiedAt }).eq("id", claimId).eq("status", "submitted").select("id").maybeSingle();
  if (error) throw new Error(`Could not classify this claim: ${error.message}`);
  if (!updated) throw new Error("This claim has already changed. Refresh and try again.");
  const { error: itemError } = await supabase.from("claim_items").update({ category }).eq("claim_id", claimId);
  if (itemError) {
    await supabase.from("claims").update({ status: "submitted", is_petty_cash: claim.is_petty_cash, classified_at: null }).eq("id", claimId).eq("status", "classified");
    throw new Error(`Could not update line item categories: ${itemError.message}`);
  }
  try {
    await writeAudit(supabase, claimId, "classify", { tool: "classify_claim", category, is_petty_cash: isPettyCash });
  } catch (error) {
    await supabase.from("claim_items").update({ category: null }).eq("claim_id", claimId);
    await supabase.from("claims").update({ status: "submitted", is_petty_cash: claim.is_petty_cash, classified_at: null }).eq("id", claimId).eq("status", "classified");
    throw error;
  }
}

export async function decideClaimRecord(claimId: string, decision: "approved" | "rejected", note: string) {
  const { supabase } = await readClaimForTransition(claimId, "classified");
  const time = new Date().toISOString();
  const { data: approval, error: approvalError } = await supabase.from("approvals").insert({ claim_id: claimId, decision, note: note || null }).select("id").single();
  if (approvalError || !approval) throw new Error(`Could not save this decision: ${approvalError?.message ?? "Please try again."}`);
  const timestamp = decision === "approved" ? { approved_at: time } : { rejected_at: time };
  const { data: updated, error } = await supabase.from("claims").update({ status: decision, ...timestamp }).eq("id", claimId).eq("status", "classified").select("id").maybeSingle();
  if (error || !updated) {
    await supabase.from("approvals").delete().eq("id", approval.id);
    throw new Error(error?.message ?? "This claim has already changed. Refresh and try again.");
  }
  try {
    await writeAudit(supabase, claimId, decision === "approved" ? "approve" : "reject", { tool: decision === "approved" ? "approve_claim" : "reject_claim", note });
  } catch (error) {
    await supabase.from("claims").update({ status: "classified", approved_at: null, rejected_at: null }).eq("id", claimId).eq("status", decision);
    await supabase.from("approvals").delete().eq("id", approval.id);
    throw error;
  }
}

export async function releaseClaimPaymentRecord(claimId: string, method: "bank_transfer" | "cash" | "cheque", reference: string) {
  const { supabase, claim } = await readClaimForTransition(claimId, "approved");
  const paidAt = new Date().toISOString();
  const { data: payment, error: paymentError } = await supabase.from("payments").insert({ claim_id: claimId, amount: claim.amount, method, reference, status: "released", paid_at: paidAt }).select("id").single();
  if (paymentError || !payment) throw new Error(`Could not save the payment: ${paymentError?.message ?? "Please try again."}`);
  const { data: updated, error } = await supabase.from("claims").update({ status: "paid", paid_at: paidAt }).eq("id", claimId).eq("status", "approved").select("id").maybeSingle();
  if (error || !updated) {
    await supabase.from("payments").delete().eq("id", payment.id);
    throw new Error(error?.message ?? "This claim has already changed. Refresh and try again.");
  }
  try {
    await writeAudit(supabase, claimId, "release", { tool: "release_payment", method, reference, amount: claim.amount });
  } catch (error) {
    await supabase.from("claims").update({ status: "approved", paid_at: null }).eq("id", claimId).eq("status", "paid");
    await supabase.from("payments").delete().eq("id", payment.id);
    throw error;
  }
}
