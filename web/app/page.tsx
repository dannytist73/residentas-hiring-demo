import Link from "next/link";
import { ROLE_TITLE } from "@/lib/job-description";

export default function HomePage() {
  return (
    <main className="min-h-screen grid place-items-center px-6 py-12">
      <div className="max-w-2xl text-center space-y-7">
        <div className="label">Residentas · Careers</div>
        <h1 className="font-display text-5xl md:text-6xl leading-[1.05]">
          Two cities. One standard of living.
        </h1>
        <p className="text-muted text-base md:text-lg leading-relaxed max-w-xl mx-auto">
          We&apos;re hiring a {ROLE_TITLE} to help run our Lisbon and Orlando portfolios.
        </p>
        <div className="pt-2">
          <Link
            href="/apply"
            className="inline-block bg-accent text-accent-ink px-8 py-3.5 tracking-[0.14em] text-sm uppercase font-medium transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Apply now
          </Link>
        </div>
      </div>
    </main>
  );
}
