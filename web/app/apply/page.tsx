import { ApplicationForm } from "@/components/application-form";

export default function ApplyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-10">
        <div className="label">Residentas · Careers</div>
        <h1 className="font-display text-4xl mt-1">Operations Associate Application</h1>
        <p className="text-muted mt-3">
          Tell us about yourself. Most candidates take 15–20 minutes.
        </p>
      </header>
      <ApplicationForm />
    </main>
  );
}
