import type { Outcome } from "@/lib/schema";

const styles: Record<Outcome, string> = {
  Advance: "border-accent text-accent bg-[rgba(204,184,149,0.08)]",
  Review: "border-hairline text-muted bg-[rgba(182,174,161,0.08)]",
  Reject: "border-reject-border text-reject-border bg-reject-soft",
};

const glyph: Record<Outcome, string> = {
  Advance: "◯",
  Review: "◐",
  Reject: "●",
};

export function OutcomeChip({ outcome }: { outcome: Outcome }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs tracking-wider uppercase rounded-sm ${styles[outcome]}`}
    >
      <span aria-hidden>{glyph[outcome]}</span>
      {outcome}
    </span>
  );
}
