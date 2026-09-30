import { createClient } from "@/lib/supabase/server";
import type { Claim } from "./types";

export async function listPaymentClaims(): Promise<Claim[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("claims").select("*, department:departments(*), claim_items(*), approvals(*), payments(*)").in("status", ["approved", "paid"]).order("approved_at", { ascending: false });
  if (error) throw new Error(`Could not load payments: ${error.message}`);
  return (data ?? []) as unknown as Claim[];
}
