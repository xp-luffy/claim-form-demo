"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: FormDataEntryValue | string | null): string {
  const path = String(value ?? "/");
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") ? path : "/";
}

export async function signInAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  if (!email || !password || email.length > 254 || password.length > 256) {
    redirect(`/login?error=${encodeURIComponent("Enter a valid email and password.")}&next=${encodeURIComponent(next)}`);
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent("We couldn't sign you in with those details.")}&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function signUpAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || email.length > 254 || password.length < 10 || password.length > 256) {
    redirect("/signup?error=" + encodeURIComponent("Use a valid email and a password with at least 10 characters."));
  }
  const supabase = await createClient();
  const appUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${appUrl}/auth/callback?next=/` },
  });
  if (error) redirect("/signup?error=" + encodeURIComponent("We couldn't create that account. Check the details or try signing in."));
  if (!data.session) redirect("/login?message=" + encodeURIComponent("Check your email to confirm your account, then sign in."));
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?message=" + encodeURIComponent("You have signed out."));
}
