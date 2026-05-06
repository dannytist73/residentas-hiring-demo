import { ApplicationForm } from "@/components/application-form";
import { ROLE_DESCRIPTION, ROLE_TITLE } from "@/lib/job-description";

export default function ApplyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 md:py-20">
      <header className="mb-12 space-y-4">
        <div className="label">Residentas · Careers</div>
        <h1 className="font-display text-4xl md:text-5xl mt-1">{ROLE_TITLE} Application</h1>
        <p className="text-muted text-base leading-relaxed max-w-2xl">
          Tell us about yourself. Most candidates take 15–20 minutes.
        </p>
      </header>
      <section className="mb-10 bg-surface border border-hairline p-6 space-y-3">
        <h2 className="label">Role brief</h2>
        <p className="text-sm text-muted whitespace-pre-line leading-relaxed">{ROLE_DESCRIPTION}</p>
      </section>
      <ApplicationForm />
    </main>
  );
}
