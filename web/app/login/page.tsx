import { loginAction } from "./actions";

type SearchParams = Promise<{ error?: string; next?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { error, next } = await searchParams;
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <form action={loginAction} className="w-full max-w-sm bg-surface border border-hairline p-8 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div>
          <div className="label">Residentas · Hiring</div>
          <h1 className="font-display text-3xl mt-1">Recruiter access</h1>
        </div>
        <label className="block">
          <span className="label">Passcode</span>
          <input
            name="passcode"
            type="password"
            required
            autoFocus
            className="mt-1 block w-full border border-hairline px-3 py-2.5 bg-panel focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-focus"
          />
        </label>
        <input type="hidden" name="next" value={next ?? ""} />
        {error ? <p className="text-sm text-reject-border">Wrong passcode.</p> : null}
        <button
          type="submit"
          className="w-full bg-accent text-accent-ink py-2.5 tracking-wider text-sm uppercase font-medium transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
