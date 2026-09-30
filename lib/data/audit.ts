import { createClient } from "@/lib/supabase/server";
import type { AuditLog } from "./types";

export async function listClaimAudit(claimId: string): Promise<AuditLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("audit_logs").select("id,action,detail,created_at").eq("entity_type", "claim").eq("entity_id", claimId).order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load the audit trail: ${error.message}`);
  return (data ?? []) as AuditLog[];
}

export type AuditEvent = AuditLog & { entity_type: string; entity_id: string; voucher_number: string | null; claim_title: string | null };

export async function listAuditEvents(claimId?: string): Promise<AuditEvent[]> {
  const supabase = await createClient();
  let query = supabase.from("audit_logs").select("id,entity_type,entity_id,action,detail,created_at").eq("entity_type", "claim").order("created_at", { ascending: false }).limit(100);
  if (claimId) query = query.eq("entity_id", claimId);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load audit activity: ${error.message}`);
  const logs = (data ?? []) as Array<AuditLog & { entity_type: string; entity_id: string }>;
  if (!logs.length) return [];
  const { data: claims, error: claimsError } = await supabase.from("claims").select("id,voucher_number,title").in("id", [...new Set(logs.map((log) => log.entity_id))]);
  if (claimsError) throw new Error(`Could not load related claims: ${claimsError.message}`);
  const byId = new Map((claims ?? []).map((claim) => [claim.id, claim]));
  return logs.map((log) => ({ ...log, voucher_number: byId.get(log.entity_id)?.voucher_number ?? null, claim_title: byId.get(log.entity_id)?.title ?? null }));
}
