"use client";

import { useActionState } from "react";
import { submitApplication, ApplyResult } from "@/app/apply/actions";

const initial: ApplyResult | null = null;

function Field({
  label,
  name,
  type = "text",
  textarea,
  errors,
  required = true,
  rows,
}: {
  label: string;
  name: string;
  type?: string;
  textarea?: boolean;
  errors: Record<string, string>;
  required?: boolean;
  rows?: number;
}) {
  const cls = "mt-1 block w-full border border-hairline px-3 py-2 bg-bg focus:outline-none focus:border-ink";
  return (
    <label className="block">
      <span className="label">{label}</span>
      {textarea ? (
        <textarea name={name} rows={rows ?? 4} required={required} className={cls} />
      ) : (
        <input name={name} type={type} required={required} className={cls} />
      )}
      {errors[name] ? <span className="text-xs text-reject-border mt-1 block">{errors[name]}</span> : null}
    </label>
  );
}

export function ApplicationForm() {
  const [state, action, pending] = useActionState(submitApplication, initial);
  const errors = state && !state.ok ? state.fieldErrors : {};

  return (
    <form action={action} className="space-y-10">
      {errors._ ? <div className="text-sm text-reject-border">{errors._}</div> : null}

      <section className="space-y-4">
        <h2 className="label">About you</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Full name" name="name" errors={errors} />
          <Field label="Email" name="email" type="email" errors={errors} />
          <Field label="Date of birth" name="dateOfBirth" type="date" errors={errors} />
          <Field label="Gender" name="gender" errors={errors} />
          <Field label="Location" name="location" errors={errors} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="label">Experience</h2>
        <Field label="Job tenure" name="jobTenure" errors={errors} />
        <Field label="Past experience" name="pastExperience" textarea errors={errors} />
        <Field label="Cross-border finance experience" name="crossBorderFinanceExperience" textarea errors={errors} rows={3} />
        <Field label="Tools used" name="toolsUsed" errors={errors} />
        <Field label="AI usage example" name="aiUsageExample" textarea errors={errors} rows={3} />
      </section>

      <section className="space-y-4">
        <h2 className="label">Open questions</h2>
        <Field label="Q1. Describe a workflow you automated end-to-end" name="q1Answer" textarea errors={errors} rows={6} />
        <Field label="Q2. What tools did you use, and why?" name="q2Answer" textarea errors={errors} rows={6} />
      </section>

      <section className="space-y-4">
        <h2 className="label">Logistics</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Currently employed" name="currentlyEmployed" errors={errors} />
          <Field label="Expected pay (USD/month)" name="expectedPay" type="number" errors={errors} />
          <Field label="Hours per week" name="hoursPerWeek" type="number" errors={errors} />
        </div>
        <Field label="Additional comments" name="additionalComments" textarea errors={errors} required={false} rows={3} />
      </section>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-white px-8 py-3 tracking-wider text-sm uppercase disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </form>
  );
}
