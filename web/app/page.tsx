import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="max-w-xl text-center space-y-5">
        <div className="label">Residentas · Careers</div>
        <h1 className="font-display text-5xl leading-tight">
          Two cities. One standard of living.
        </h1>
        <p className="text-muted">
          We're hiring an Operations Associate to help run our Lisbon and Orlando portfolios.
        </p>
        <div className="pt-4">
          <Link
            href="/apply"
            className="inline-block bg-ink text-white px-6 py-3 tracking-wider text-sm uppercase"
          >
            Apply now
          </Link>
        </div>
      </div>
    </main>
  );
}
