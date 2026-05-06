import { notFound } from "next/navigation";
import { getCandidate } from "@/lib/airtable";
import { CandidateDetail } from "@/components/candidate-detail";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function DetailPage({ params }: Params) {
  const { id } = await params;
  const candidate = await getCandidate(id);
  if (!candidate) notFound();
  return (
    <div className="space-y-4">
      <Link
        href="/dashboard"
        className="text-xs tracking-wider uppercase text-muted hover:text-ink transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        ← All candidates
      </Link>
      <CandidateDetail initial={candidate} />
    </div>
  );
}
