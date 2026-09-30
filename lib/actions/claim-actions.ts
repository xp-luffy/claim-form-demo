"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ClaimType } from "@/lib/data/types";

const claimTypes: ClaimType[] = ["petty_cash", "expense", "travel", "others"];

function fail(message: string): never {
  redirect(`/claims/new?error=${encodeURIComponent(message)}`);
}

export async function submitClaim(formData: FormData): Promise<void> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const departmentId = String(formData.get("department_id") ?? "");
  const claimType = String(formData.get("claim_type") ?? "petty_cash") as ClaimType;
  const isPettyCash = formData.get("is_petty_cash") === "on";
  const descriptions = formData.getAll("item_description").map((value) => String(value).trim());
  const amounts = formData.getAll("item_amount").map((value) => Number(value));

  if (!title) fail("Title is required.");
  if (!departmentId) fail("Choose a department.");
  if (!claimTypes.includes(claimType)) fail("Choose a valid claim type.");
  if (!descriptions.length || descriptions.some((item) => !item)) fail("Add at least one line item description.");
  if (amounts.length !== descriptions.length || amounts.some((amount) => !Number.isFinite(amount) || amount <= 0)) {
    fail("Enter a valid amount for every line item.");
  }

  const total = Math.round(amounts.reduce((sum, amount) => sum + amount, 0) * 100) / 100;
  const supabase = await createClient();
  const { data: voucherNumber, error: voucherError } = await supabase.rpc("next_claim_voucher_number");
  if (voucherError || !voucherNumber) fail("Could not assign a voucher number. Please try again.");

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .insert({
      voucher_number: voucherNumber,
      department_id: departmentId,
      claim_type: claimType,
      title,
      description: description || null,
      amount: total,
      currency: "MYR",
      status: "submitted",
      is_petty_cash: isPettyCash,
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (claimError || !claim) fail(`Could not save claim. ${claimError?.message ?? "Please try again."}`);

  const { error: itemsError } = await supabase.from("claim_items").insert(
    descriptions.map((itemDescription, index) => ({
      claim_id: claim.id,
      description: itemDescription,
      amount: Math.round(amounts[index] * 100) / 100,
    })),
  );

  if (itemsError) {
    await supabase.from("claims").delete().eq("id", claim.id);
    fail(`Could not save claim items. ${itemsError.message}`);
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    entity_type: "claim",
    entity_id: claim.id,
    action: "submit",
    detail: JSON.stringify({ tool: "submit_claim", voucher_number: voucherNumber, actor: "staff" }),
  });

  if (auditError) {
    await supabase.from("claims").delete().eq("id", claim.id);
    fail(`Could not record the claim submission. ${auditError.message}`);
  }

  revalidatePath("/claims");
  redirect(`/claims/${claim.id}`);
}
