# AI Voice Interview Concept Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a static AI voice interview concept section below the thank-you text on `/apply/thank-you`, showing the Residentas team the ElevenLabs + Claude hiring pipeline vision.

**Architecture:** Single file edit to `web/app/apply/thank-you/page.tsx`. The entire section is self-contained JSX with inline SVG — no new components, no new routes, no API calls, no client directive needed.

**Tech Stack:** Next.js (App Router, server component), Tailwind CSS v4, inline SVG

---

## File Map

| Action | File | What changes |
|--------|------|--------------|
| Modify | `web/app/apply/thank-you/page.tsx` | Replace minimal 3-line layout with full page including concept section |

No new files. No other files touched.

---

### Task 1: Implement the AI interview concept section

**Files:**
- Modify: `web/app/apply/thank-you/page.tsx`

**Design tokens in use** (from `web/app/globals.css`):

| Token | Hex | Tailwind class |
|-------|-----|----------------|
| bg | #0f1012 | `bg-bg` |
| surface | #17191d | `bg-surface` |
| panel | #1f2228 | `bg-panel` |
| ink | #f3f1eb | `text-ink` |
| muted | #b6aea1 | `text-muted` |
| hairline | #343842 | `border-hairline` / `divide-hairline` |
| accent | #ccb895 | `text-accent` / `bg-accent` |

The `label` utility (`font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:muted`) is available as a class.

---

- [ ] **Step 1: Replace the thank-you page with the full implementation**

Open `web/app/apply/thank-you/page.tsx` and replace its entire contents with:

```tsx
export default function ThankYouPage() {
  const scores = [
    { label: "Autonomy", value: 8, pct: "80%" },
    { label: "Tool fluency", value: 9, pct: "90%" },
    { label: "Communication", value: 7, pct: "70%" },
  ];

  const stackItems = [
    { name: "ElevenLabs", desc: "Voices interview questions via TTS — natural, professional tone", dim: false },
    { name: "Claude", desc: "Scores transcribed answers by dimension, generates summary", dim: false },
    { name: "Airtable", desc: "Scores sync back to candidate record automatically", dim: false },
    { name: "n8n (optional)", desc: "Orchestrates the full flow end-to-end", dim: true },
  ];

  const questions = [
    { tag: "Q1 · Automation", q: "“Walk me through a workflow you automated end-to-end. What broke first, and how did you fix it?”" },
    { tag: "Q2 · Cross-border ops", q: "“You’re handling an urgent payment for a client in a different timezone. Walk me through your process.”" },
    { tag: "Q3 · AI usage", q: "“Tell me about the last time you used AI to solve a real work problem. What was your prompt strategy?”" },
    { tag: "Q4 · Judgement", q: "“A client asks you to do something that feels slightly off. How do you handle it without burning the relationship?”" },
  ];

  return (
    <main className="min-h-screen px-6 py-16">
      {/* Thank you */}
      <div className="max-w-md mx-auto text-center space-y-4 pb-16">
        <div className="label">Application received</div>
        <h1 className="font-display text-5xl">Thank you</h1>
        <p className="text-muted text-base leading-relaxed">We&apos;ll be in touch soon.</p>
      </div>

      {/* Concept section */}
      <div className="max-w-3xl mx-auto">

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-hairline" />
          <span className="label whitespace-nowrap">What comes next · Concept</span>
          <div className="flex-1 h-px bg-hairline" />
        </div>

        {/* Spec card */}
        <div className="border border-hairline">

          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-hairline">
            <div className="flex items-center gap-3">
              <span className="text-ink text-sm font-medium">AI-Assisted Voice Interview</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full border"
                style={{ color: "#ccb895", background: "#1a1409", borderColor: "#3a2a10" }}
              >
                Concept
              </span>
            </div>
            <span className="label">ElevenLabs · Claude · Airtable</span>
          </div>

          {/* Three panels */}
          <div className="grid grid-cols-3 divide-x divide-hairline">

            {/* Concept */}
            <div className="p-5">
              <div className="label mb-3">Concept</div>
              <p className="text-muted text-xs leading-relaxed">
                Shortlisted candidates complete a structured voice interview before any human
                review. ElevenLabs voices the questions; candidates respond by speaking in the
                browser. Async — no scheduling, no back-and-forth.
              </p>
              <p className="text-xs leading-relaxed mt-3" style={{ color: "#555" }}>
                Surfaces depth, communication, and reasoning that written answers often miss.
              </p>
            </div>

            {/* Stack */}
            <div className="p-5">
              <div className="label mb-3">Stack</div>
              <ul className="space-y-3">
                {stackItems.map(({ name, desc, dim }) => (
                  <li key={name} className="flex gap-2 items-start">
                    <span
                      className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                      style={{ background: dim ? "#555" : "#ccb895" }}
                    />
                    <div>
                      <div
                        className="text-xs font-medium"
                        style={{ color: dim ? "#666" : "#b6aea1" }}
                      >
                        {name}
                      </div>
                      <div className="text-xs leading-relaxed" style={{ color: dim ? "#444" : "#666" }}>
                        {desc}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Output */}
            <div className="p-5">
              <div className="label mb-3">Output (hiring team sees)</div>
              <div className="text-xs text-muted mb-2">Score per dimension</div>
              <div className="bg-panel border border-hairline p-3 space-y-2 mb-3">
                {scores.map(({ label, value, pct }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-muted">{label}</span>
                      <span className="text-xs text-accent">{value}/10</span>
                    </div>
                    <div className="h-0.5 bg-surface rounded">
                      <div className="h-0.5 bg-accent rounded" style={{ width: pct }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs" style={{ color: "#555" }}>
                + AI transcript · generated summary · hire / skip flag
              </p>
            </div>
          </div>

          {/* Flow diagram */}
          <div className="border-t border-hairline bg-panel px-5 py-4">
            <div className="label mb-3">Flow</div>
            <svg viewBox="0 0 640 56" className="w-full" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="8" width="110" height="38" rx="2" fill="#1f2228" stroke="#343842" strokeWidth=".8" />
              <text x="55" y="24" fontSize="8" fill="#b6aea1" textAnchor="middle" fontFamily="monospace">Shortlisted</text>
              <text x="55" y="36" fontSize="7" fill="#666" textAnchor="middle" fontFamily="monospace">invite sent via email</text>

              <line x1="110" y1="27" x2="130" y2="27" stroke="#343842" strokeWidth="1" strokeDasharray="3,2" />
              <polygon points="130,24 136,27 130,30" fill="#343842" />

              <rect x="136" y="8" width="110" height="38" rx="2" fill="#1a1409" stroke="#3a2a10" strokeWidth=".8" />
              <text x="191" y="24" fontSize="8" fill="#ccb895" textAnchor="middle" fontFamily="monospace">ElevenLabs</text>
              <text x="191" y="36" fontSize="7" fill="#7a6030" textAnchor="middle" fontFamily="monospace">voices each question</text>

              <line x1="246" y1="27" x2="266" y2="27" stroke="#343842" strokeWidth="1" strokeDasharray="3,2" />
              <polygon points="266,24 272,27 266,30" fill="#343842" />

              <rect x="272" y="8" width="110" height="38" rx="2" fill="#1f2228" stroke="#343842" strokeWidth=".8" />
              <text x="327" y="24" fontSize="8" fill="#b6aea1" textAnchor="middle" fontFamily="monospace">Candidate speaks</text>
              <text x="327" y="36" fontSize="7" fill="#666" textAnchor="middle" fontFamily="monospace">browser mic · recorded</text>

              <line x1="382" y1="27" x2="402" y2="27" stroke="#343842" strokeWidth="1" strokeDasharray="3,2" />
              <polygon points="402,24 408,27 402,30" fill="#343842" />

              <rect x="408" y="8" width="110" height="38" rx="2" fill="#1a1409" stroke="#3a2a10" strokeWidth=".8" />
              <text x="463" y="24" fontSize="8" fill="#ccb895" textAnchor="middle" fontFamily="monospace">Claude</text>
              <text x="463" y="36" fontSize="7" fill="#7a6030" textAnchor="middle" fontFamily="monospace">scores + summarises</text>

              <line x1="518" y1="27" x2="538" y2="27" stroke="#343842" strokeWidth="1" strokeDasharray="3,2" />
              <polygon points="538,24 544,27 538,30" fill="#343842" />

              <rect x="544" y="8" width="96" height="38" rx="2" fill="#1f2228" stroke="#343842" strokeWidth=".8" />
              <text x="592" y="24" fontSize="8" fill="#b6aea1" textAnchor="middle" fontFamily="monospace">Airtable</text>
              <text x="592" y="36" fontSize="7" fill="#666" textAnchor="middle" fontFamily="monospace">record updated</text>
            </svg>
          </div>
        </div>

        {/* Sample questions */}
        <div className="border border-hairline mt-0.5">
          <div className="px-5 py-3 border-b border-hairline">
            <span className="label">Sample interview questions</span>
          </div>
          <div className="grid grid-cols-2">
            {questions.map(({ tag, q }, i) => (
              <div
                key={tag}
                className={[
                  "p-5",
                  i % 2 === 0 ? "border-r border-hairline" : "",
                  i < 2 ? "border-b border-hairline" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="label mb-2">{tag}</div>
                <p className="text-muted text-xs leading-relaxed">{q}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles with no errors**

Run from the `web/` directory:

```bash
cd web && npx tsc --noEmit
```

Expected: no output, exit code 0. If errors appear, they will be in `thank-you/page.tsx` — likely an SVG prop that needs camelCase correction (e.g. `stroke-width` → `strokeWidth`). Fix in place and re-run.

- [ ] **Step 3: Start the dev server and verify visually**

```bash
cd web && npm run dev
```

Open `http://localhost:3000/apply/thank-you` in a browser.

**Check:**
- [ ] "Application received" · "Thank you" · "We'll be in touch soon." appear at the top, centered
- [ ] "What comes next · Concept" divider appears below with lines on each side
- [ ] Three-panel card renders with Concept / Stack / Output columns separated by hairline borders
- [ ] "Concept" badge is gold-on-dark
- [ ] Score bars are visible in the Output panel
- [ ] Flow SVG renders all 5 boxes with dashed arrows between them
- [ ] Sample questions grid shows 2×2 layout with correct borders
- [ ] No layout overflow on a standard desktop viewport (1280px+)

Stop the dev server when done (`Ctrl+C`).

- [ ] **Step 4: Commit**

```bash
git add web/app/apply/thank-you/page.tsx
git commit -m "feat(web): add AI voice interview concept section to thank-you page"
```

Expected output: `1 file changed` on `web/app/apply/thank-you/page.tsx`.

---

## Self-Review

**Spec coverage:**
- [x] "What comes next · Concept" divider — Step 1 (divider JSX)
- [x] Three-panel card (Concept · Stack · Output) — Step 1 (grid grid-cols-3)
- [x] Card header with badge and tech stack label — Step 1 (card header JSX)
- [x] Flow diagram SVG (5 steps) — Step 1 (SVG block)
- [x] Sample questions 2×2 grid — Step 1 (questions grid JSX)
- [x] Matches existing dark theme — design tokens table in Task 1
- [x] No new components / routes / API calls — single file edit
- [x] "Concept" badge uses accent color — inline style `color: "#ccb895"`

**Placeholders:** None.

**Type consistency:** No cross-task type references. Single task, all types inline.
