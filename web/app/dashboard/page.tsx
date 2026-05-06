import { listCandidates } from "@/lib/airtable";
import { CandidateList } from "@/components/candidate-list";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const initial = await listCandidates();
  return <CandidateList initial={initial} />;
}
