import Link from "next/link";
import { signInAction } from "@/lib/actions/auth-actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; next?: string }> }) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <Link className="brand" href="/"><span className="brand-mark">f.</span> fieldnote</Link>
      <section className="panel mt-8 p-6 sm:p-8">
        <div className="page-kicker">Welcome back</div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Sign in to your claims.</h1>
        <p className="mt-2 text-sm text-slate-500">Use your work email to continue.</p>
        {params.error && <div role="alert" className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 error-text">{params.error}</div>}
        {params.message && <div role="status" className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 success-text">{params.message}</div>}
        <form action={signInAction} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={params.next ?? "/"} />
          <label className="block"><span className="field-label">Email</span><input className="field" name="email" type="email" autoComplete="email" required maxLength={254} /></label>
          <label className="block"><span className="field-label">Password</span><input className="field" name="password" type="password" autoComplete="current-password" required maxLength={256} /></label>
          <button className="button button-primary w-full justify-center" type="submit">Sign in <span aria-hidden="true">→</span></button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">New to Fieldnote? <Link className="font-semibold text-[#24594d] hover:underline" href="/signup">Create an account</Link></p>
      </section>
    </div>
  );
}
