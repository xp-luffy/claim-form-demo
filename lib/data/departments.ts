import { createClient } from "@/lib/supabase/server";
import type { Department } from "./types";

export async function listDepartments(): Promise<Department[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("departments").select("*").order("name");
  if (error) throw new Error(`Could not load departments: ${error.message}`);
  return (data ?? []) as Department[];
}

export async function createDepartmentRecord(name: string, code: string): Promise<void> {
  if (name.length > 80 || !/^[A-Z0-9_-]{2,8}$/.test(code)) throw new Error("Use a short code with 2–8 letters or numbers.");
  const supabase = await createClient();
  const { error } = await supabase.from("departments").insert({ name, code });
  if (error) throw new Error(error.code === "23505" ? "That department code is already in use." : `Could not add department: ${error.message}`);
}

export async function updateDepartmentRecord(id: string, name: string, code: string): Promise<void> {
  if (name.length > 80 || !/^[A-Z0-9_-]{2,8}$/.test(code)) throw new Error("Use a short code with 2–8 letters or numbers.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("departments").update({ name, code }).eq("id", id).select("id").maybeSingle();
  if (error) throw new Error(error.code === "23505" ? "That department code is already in use." : `Could not update department: ${error.message}`);
  if (!data) throw new Error("Department not found.");
}
