import { logoutAction } from "@/app/login/actions";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-hairline bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className="label">Residentas · Hiring</div>
            <div className="font-display text-2xl leading-tight">Candidate pipeline</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-xs tracking-wider uppercase text-muted hover:text-ink transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
