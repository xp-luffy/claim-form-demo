import { createClient } from "@/lib/supabase/server";
import type { Department } from "./types";

export async function listDepartments(): Promise<Department[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("departments").select("*").order("name");
  if (error) throw new Error(`Could not load departments: ${error.message}`);
  return (data ?? []) as Department[];
}
