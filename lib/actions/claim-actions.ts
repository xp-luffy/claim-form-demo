"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { classifyClaimRecord, decideClaimRecord, releaseClaimPaymentRecord, submitClaimRecord } from "@/lib/data/claims";
import { createDepartmentRecord, updateDepartmentRecord } from "@/lib/data/departments";
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
  if (title.length > 120) fail("Keep the claim title under 120 characters.");
  if (description.length > 1000) fail("Keep the description under 1,000 characters.");
  if (!departmentId) fail("Choose a department.");
  if (!claimTypes.includes(claimType)) fail("Choose a valid claim type.");
  if (!descriptions.length || descriptions.some((item) => !item || item.length > 200)) fail("Add at least one line item description under 200 characters.");
  if (amounts.length !== descriptions.length || amounts.some((amount) => !Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) < 1)) {
    fail("Enter a valid amount for every line item.");
  }

  let claimId: string;
  try {
    claimId = await submitClaimRecord({
      title,
      description: description || null,
      departmentId,
      claimType,
      isPettyCash,
      items: descriptions.map((itemDescription, index) => ({ description: itemDescription, amount: Math.round(amounts[index] * 100) / 100 })),
    });
  } catch (error) {
    fail(error instanceof Error ? error.message : "Could not save claim. Please try again.");
  }
  revalidatePath("/claims");
  revalidatePath("/");
  redirect(`/claims/${claimId}`);
}

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function classifyClaimAction(formData: FormData): Promise<void> {
  const id = value(formData, "claim_id");
  const category = value(formData, "category");
  const isPettyCash = formData.get("is_petty_cash") === "on";
  if (!id || !category || category.length > 80) redirect(`/claims/${id}?error=${encodeURIComponent("Enter a category under 80 characters before classifying.")}`);
  try { await classifyClaimRecord(id, category, isPettyCash); }
  catch (error) { redirect(`/claims/${id}?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not classify this claim.")}`); }
  revalidatePath(`/claims/${id}`);
  revalidatePath("/claims");
  revalidatePath("/");
  redirect(`/claims/${id}?success=classified`);
}

async function decisionAction(formData: FormData, decision: "approved" | "rejected"): Promise<void> {
  const id = value(formData, "claim_id");
  if (!id) redirect("/claims");
  const note = value(formData, "note");
  if (note.length > 500) redirect(`/claims/${id}?error=${encodeURIComponent("Keep the decision note under 500 characters.")}`);
  try { await decideClaimRecord(id, decision, note); }
  catch (error) { redirect(`/claims/${id}?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not save this decision.")}`); }
  revalidatePath(`/claims/${id}`);
  revalidatePath("/claims");
  revalidatePath("/");
  revalidatePath("/payments");
  redirect(`/claims/${id}?success=${decision}`);
}

export async function approveClaimAction(formData: FormData): Promise<void> {
  await decisionAction(formData, "approved");
}

export async function rejectClaimAction(formData: FormData): Promise<void> {
  await decisionAction(formData, "rejected");
}

export async function releasePaymentAction(formData: FormData): Promise<void> {
  const id = value(formData, "claim_id");
  const method = value(formData, "method");
  const reference = value(formData, "reference");
  if (!id) redirect("/payments");
  if (!(method === "bank_transfer" || method === "cash" || method === "cheque") || !reference || reference.length > 80) {
    redirect(`/payments?error=${encodeURIComponent("Choose a payment method and enter its reference.")}`);
  }
  try { await releaseClaimPaymentRecord(id, method, reference); }
  catch (error) { redirect(`/payments?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not release this payment.")}`); }
  revalidatePath(`/claims/${id}`);
  revalidatePath("/claims");
  revalidatePath("/");
  revalidatePath("/payments");
  redirect(`/payments?success=${encodeURIComponent("Payment released and recorded.")}`);
}

export async function createDepartmentAction(formData: FormData): Promise<void> {
  const name = value(formData, "name");
  const code = value(formData, "code").toUpperCase();
  if (!name || !code) redirect(`/departments?error=${encodeURIComponent("Enter a department name and code.")}`);
  try { await createDepartmentRecord(name, code); }
  catch (error) { redirect(`/departments?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not add department.")}`); }
  revalidatePath("/departments");
  revalidatePath("/");
  revalidatePath("/claims/new");
  redirect(`/departments?success=${encodeURIComponent(`${name} was added.`)}`);
}

export async function updateDepartmentAction(formData: FormData): Promise<void> {
  const id = value(formData, "department_id");
  const name = value(formData, "name");
  const code = value(formData, "code").toUpperCase();
  if (!id || !name || !code) redirect(`/departments?error=${encodeURIComponent("Enter a department name and code.")}`);
  try { await updateDepartmentRecord(id, name, code); }
  catch (error) { redirect(`/departments?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not update department.")}`); }
  revalidatePath("/departments");
  revalidatePath("/");
  revalidatePath("/claims/new");
  redirect(`/departments?success=${encodeURIComponent(`${name} was updated.`)}`);
}
