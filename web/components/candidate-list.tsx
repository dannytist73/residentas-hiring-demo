"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CandidateRecord, Status } from "@/lib/schema";
import { OutcomeChip } from "./outcome-chip";

const FILTERS: { label: string; value: Status | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Pending Review", value: "Pending Review" },
  { label: "Sent", value: "Sent" },
  { label: "Failed", value: "Failed" },
];

export function CandidateList({ initial }: { initial: CandidateRecord[] }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<Status | "All">("Pending Review");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/candidates", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        if (!cancelled) {
          setRows(json.candidates);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Could not load candidates — retrying");
      }
    };
    const id = setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const counts = useMemo(() => {
    const c = { "Pending Review": 0, "Sent": 0, "Failed": 0, "Pending Scoring": 0 } as Record<Status, number>;
    for (const r of rows) c[r.status]++;
    return c;
  }, [rows]);

  const visible = filter === "All" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted">
          {counts["Pending Review"]} pending review · {counts["Sent"]} sent · {counts["Failed"]} failed
        </p>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs tracking-wider uppercase px-3 py-1 border ${
                filter === f.value ? "border-ink text-ink" : "border-hairline text-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-xs text-reject-border mb-3">{error}</p> : null}

      <div className="bg-surface border border-hairline">
        <table className="w-full text-sm">
          <thead className="border-b border-hairline">
            <tr className="text-left">
              <th className="font-normal label py-3 px-4">Name</th>
              <th className="font-normal label py-3 px-4">Submitted</th>
              <th className="font-normal label py-3 px-4">Score</th>
              <th className="font-normal label py-3 px-4">Outcome</th>
              <th className="font-normal label py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted">
                  No candidates in this view.
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr key={r.id} className="border-t border-hairline hover:bg-bg">
                  <td className="py-3 px-4">
                    <Link href={`/dashboard/${r.id}`} className="hover:underline">
                      <div>{r.name}</div>
                      <div className="text-xs text-muted">{r.email}</div>
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-muted">
                    {new Date(r.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {r.totalScore != null ? `${r.totalScore} / 25` : "—"}
                  </td>
                  <td className="py-3 px-4">{r.outcome ? <OutcomeChip outcome={r.outcome} /> : "—"}</td>
                  <td className="py-3 px-4 text-muted">{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
