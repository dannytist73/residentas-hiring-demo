"use client";

import { useEffect, useRef, useState } from "react";
import type { CandidateRecord } from "@/lib/schema";
import { OutcomeChip } from "./outcome-chip";
import { ScoreBar } from "./score-bar";
import { ROLE_DESCRIPTION, ROLE_TITLE } from "@/lib/job-description";

const CRITERIA = [
  { key: "processThinking", rationaleKey: "processThinkingRationale", label: "Process Thinking" },
  { key: "practicalAutomation", rationaleKey: "practicalAutomationRationale", label: "Practical Automation" },
  { key: "clarityCommunication", rationaleKey: "clarityCommunicationRationale", label: "Clarity & Communication" },
  { key: "executionLogic", rationaleKey: "executionLogicRationale", label: "Execution Logic" },
  { key: "reliabilityAwareness", rationaleKey: "reliabilityAwarenessRationale", label: "Reliability Awareness" },
] as const;

const AUTOSAVE_MS = 1500;
const POLL_MS = 30_000;

async function patchCandidate(id: string, body: { subject?: string; body?: string; readyToSend?: true }) {
  const res = await fetch(`/api/candidates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${res.status}`);
}

export function CandidateDetail({ initial }: { initial: CandidateRecord }) {
  const [record, setRecord] = useState(initial);
  const [subject, setSubject] = useState(initial.draftedEmailSubject ?? "");
  const [body, setBody] = useState(initial.draftedEmailBody ?? "");
  const dirty = useRef({ subject: false, body: false });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/candidates/${record.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        const fresh: CandidateRecord = json.candidate;
        setRecord(fresh);
        if (!dirty.current.subject) setSubject(fresh.draftedEmailSubject ?? "");
        if (!dirty.current.body) setBody(fresh.draftedEmailBody ?? "");
      } catch {}
    };
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [record.id]);

  useEffect(() => {
    if (!dirty.current.subject) return;
    const t = setTimeout(() => {
      void patchCandidate(record.id, { subject }).catch(() => {});
    }, AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [subject, record.id]);

  useEffect(() => {
    if (!dirty.current.body) return;
    const t = setTimeout(() => {
      void patchCandidate(record.id, { body }).catch(() => {});
    }, AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [body, record.id]);

  async function onMarkReady() {
    setSending(true);
    try {
      await patchCandidate(record.id, { subject, body, readyToSend: true });
      setRecord((prev) => ({ ...prev, status: "Ready to Send" }));
      setToast("Marked as Ready to Send. n8n scheduler will send it shortly.");
    } catch {
      setToast("Update failed. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const canMarkReady = record.status === "Pending Review" && !sending;
  const showLetter = record.status !== "Pending Scoring";
  const showSent = record.status === "Sent";
  const showReady = record.status === "Ready to Send";
  const lockEdits = showSent || showReady;
  const roleTitle = record.jobTitle || ROLE_TITLE;
  const roleDescription = record.jobDescription || ROLE_DESCRIPTION;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left pane */}
      <section className="bg-surface border border-hairline p-6 space-y-6 shadow-[0_14px_50px_rgba(0,0,0,0.28)]">
        <div>
          <div className="flex items-center gap-3">
            {record.outcome ? <OutcomeChip outcome={record.outcome} /> : null}
            {record.totalScore != null ? (
              <span className="label">{record.totalScore} / 25</span>
            ) : null}
          </div>
          <h1 className="font-display text-4xl mt-2 leading-tight">{record.name}</h1>
          <div className="text-sm text-muted mt-1">{record.email}</div>
        </div>

        {record.status === "Failed" && record.lastError ? (
          <div className="border border-reject-border bg-reject-soft p-3 text-sm">
            <div className="label">Scoring failed</div>
            <div className="mt-1">{record.lastError}</div>
          </div>
        ) : null}

        <div className="space-y-3">
          <h2 className="label">Role context</h2>
          <div className="border border-hairline bg-panel p-3">
            <p className="font-display text-xl">{roleTitle}</p>
            <p className="text-sm text-muted whitespace-pre-line mt-2 leading-relaxed">{roleDescription}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="label">Original answers</h2>
          <Answer label="Past experience" value={record.pastExperience} />
          <Answer label="Tools used" value={record.toolsUsed} />
          <Answer label="Q1. Workflow you automated" value={record.q1Answer} />
          <Answer label="Q2. Tools and why" value={record.q2Answer} />
        </div>

        {record.totalScore != null ? (
          <div className="space-y-4">
            <h2 className="label">AI scores</h2>
            {CRITERIA.map(({ key, rationaleKey, label }) => {
              const v = (record as unknown as Record<string, number | undefined>)[key];
              const r = (record as unknown as Record<string, string | undefined>)[rationaleKey];
              if (v == null) return null;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="text-muted">{v} / 5</span>
                  </div>
                  <div className="mt-1.5"><ScoreBar value={v} /></div>
                  {r ? <p className="mt-2 text-sm text-muted">{r}</p> : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </section>

      {/* Right pane */}
      <section className="bg-surface border border-hairline p-6 space-y-4 shadow-[0_14px_50px_rgba(0,0,0,0.28)]">
        {!showLetter ? (
          <div className="py-16 text-center">
            <div className="label">Pending</div>
            <p className="font-display text-2xl mt-2">AI is still scoring this application…</p>
            <p className="text-muted mt-2 text-sm">This typically takes under a minute.</p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="label">Drafted letter</h2>
              {showSent ? (
                <p className="text-xs text-muted mt-1">
                  Sent {record.sentAt ? new Date(record.sentAt).toLocaleString() : ""}
                </p>
              ) : (
                <p className="text-xs text-muted mt-1">Edits autosave</p>
              )}
            </div>

            <label className="block">
              <span className="label">Subject</span>
              <input
                className="mt-1 block w-full border border-hairline px-3 py-2 bg-panel disabled:opacity-60 focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-focus"
                value={subject}
                disabled={lockEdits}
                onChange={(e) => {
                  dirty.current.subject = true;
                  setSubject(e.target.value);
                }}
              />
            </label>

            <label className="block">
              <span className="label">Body</span>
              <textarea
                rows={16}
                className="mt-1 block w-full border border-hairline px-3 py-2 bg-panel font-display text-base leading-relaxed disabled:opacity-60 focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-focus"
                value={body}
                disabled={lockEdits}
                onChange={(e) => {
                  dirty.current.body = true;
                  setBody(e.target.value);
                }}
              />
            </label>

            {!showSent && !showReady ? (
              <div className="flex justify-end pt-2">
                <button
                  onClick={onMarkReady}
                  disabled={!canMarkReady}
                  className="bg-accent text-accent-ink px-6 py-3 tracking-wider text-sm uppercase font-medium transition hover:brightness-110 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {sending ? "Updating…" : "Mark ready to send"}
                </button>
              </div>
            ) : null}

            {toast ? <p className="text-xs text-muted">{toast}</p> : null}
          </>
        )}
      </section>
    </div>
  );
}

function Answer({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="label">{label}</div>
      <p className="text-sm whitespace-pre-wrap mt-1">{value}</p>
    </div>
  );
}
