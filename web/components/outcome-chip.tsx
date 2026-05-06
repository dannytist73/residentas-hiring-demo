import type { Outcome } from "@/lib/schema";

const styles: Record<Outcome, string> = {
  Advance: "border-ink text-ink",
  Review: "border-muted text-muted",
  Reject: "border-reject-border text-reject-border",
};

const glyph: Record<Outcome, string> = {
  Advance: "◯",
  Review: "◐",
  Reject: "●",
};

export function OutcomeChip({ outcome }: { outcome: Outcome }) {
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs tracking-wider uppercase ${styles[outcome]}`}>
      <span aria-hidden>{glyph[outcome]}</span>
      {outcome}
    </span>
  );
}
