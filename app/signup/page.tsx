import Link from "next/link";
import { signUpAction } from "@/lib/actions/auth-actions";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <Link className="brand" href="/"><span className="brand-mark">f.</span> fieldnote</Link>
      <section className="panel mt-8 p-6 sm:p-8">
        <div className="page-kicker">Get started</div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Create your account.</h1>
        <p className="mt-2 text-sm text-slate-500">New accounts can submit and track their own claims.</p>
        {error && <div role="alert" className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 error-text">{error}</div>}
        <form action={signUpAction} className="mt-6 space-y-4">
          <label className="block"><span className="field-label">Work email</span><input className="field" name="email" type="email" autoComplete="email" required maxLength={254} /></label>
          <label className="block"><span className="field-label">Password</span><input className="field" name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={256} /><span className="mt-1 block text-[11px] text-slate-400">Use at least 10 characters.</span></label>
          <button className="button button-primary w-full justify-center" type="submit">Create account <span aria-hidden="true">→</span></button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">Already registered? <Link className="font-semibold text-[#24594d] hover:underline" href="/login">Sign in</Link></p>
      </section>
    </div>
  );
}
