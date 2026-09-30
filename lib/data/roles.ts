import { createClient } from "@/lib/supabase/server";

export async function currentUserRoles(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (error) throw new Error(`Could not load your permissions: ${error.message}`);
  return (data ?? []).map((entry) => entry.role);
}

export async function currentUserHasRole(role: "finance" | "approver"): Promise<boolean> {
  return (await currentUserRoles()).includes(role);
}
