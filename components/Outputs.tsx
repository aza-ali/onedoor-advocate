"use client";

import type { ScreenResult, Citation, Recommendation } from "../lib/types";

// Results view for One Door Advocate. Renders the screening outcome as three
// mobile-first cards (qualify / bring / ask) plus a footer carrying the
// disclaimer and a navigator fallback. Grounding contract: ONLY CalFresh shows
// a computed dollar figure, and only when likely_eligible; recommendations and
// every other surface carry NO dollar figures. Every fact shows its citation.
// Inline styles + CSS vars match the rest of the app; logical properties keep
// the layout RTL-aware so it flips for Farsi/Arabic by inheriting document dir.

// ── shared style atoms ──────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  padding: 16,
  marginBottom: 14,
  textAlign: "start",
};

const cardTitle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: "-0.01em",
};

const listReset: React.CSSProperties = {
  margin: 0,
  // Inset on the leading edge so bullets follow writing direction under RTL.
  paddingInlineStart: 20,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

// Map each verdict to its accent token + human label. needs_more_info shares
// the "maybe" warn color since it is not a no.
function verdict(status: ScreenResult["status"]): { color: string; label: string } {
  switch (status) {
    case "likely_eligible":
      return { color: "var(--accent)", label: "You likely qualify" };
    case "possibly_eligible":
      return { color: "var(--warn)", label: "You may qualify" };
    case "likely_not_eligible":
      return { color: "var(--bad)", label: "You likely do not qualify" };
    default:
      return { color: "var(--warn)", label: "We need a little more to be sure" };
  }
}

// ── citation chips ──────────────────────────────────────────────────────────

// A small source chip. Links out when a source_url is present, otherwise renders
// as a static label. Used to attach a source to every fact and recommendation.
function CitationChip({ citation }: { citation: Pick<Citation, "source_id" | "source_url"> }) {
  const inner = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 999,
        border: "1px solid var(--line)",
        background: "var(--panel2)",
        color: "var(--mut)",
        fontSize: 11,
        lineHeight: 1.6,
        whiteSpace: "nowrap",
      }}
      className="mono"
    >
      {citation.source_id}
    </span>
  );

  if (citation.source_url) {
    return (
      <a
        href={citation.source_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none" }}
        title={`Source: ${citation.source_id}`}
      >
        {inner}
      </a>
    );
  }
  return inner;
}

function CitationRow({ citations }: { citations: ScreenResult["citations"] }) {
  if (!citations?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
      {citations.map((c, i) => (
        <CitationChip key={`${c.source_id}-${i}`} citation={c} />
      ))}
    </div>
  );
}

// ── recommendation card (NO dollar figures, by contract) ────────────────────

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const cite = rec.adjunctive_or_threshold_citation;
  return (
    <div
      style={{
        background: "var(--panel2)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: 12,
        textAlign: "start",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{rec.program}</span>
        {cite && <CitationChip citation={{ source_id: cite.source_id, source_url: null }} />}
      </div>
      {rec.reason && (
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--mut)", lineHeight: 1.5 }}>{rec.reason}</p>
      )}
      {cite?.note && (
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--mut)", lineHeight: 1.5 }}>{cite.note}</p>
      )}
      {rec.next_step && (
        <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.5 }}>
          <span style={{ color: "var(--mut)" }}>Next step: </span>
          {rec.next_step}
        </p>
      )}
    </div>
  );
}

// ── static interview-prep content (harvested; lightly adapted to result) ─────

const BRING_TO_INTERVIEW: string[] = [
  "Photo ID (driver's license, passport, or consular ID)",
  "Proof of income (your last pay stub)",
  "Proof of rent or mortgage",
  "Social Security numbers for anyone applying (optional for some members)",
];

const WHAT_THEY_ASK: string[] = [
  "Your household size and who buys and prepares food together",
  "Your income and the work requirement",
  "Immigration status, where only those applying need to answer, and a citizen child can get benefits even if a parent does not",
];

// ── main component ──────────────────────────────────────────────────────────

export default function Outputs({ result }: { result: ScreenResult | null }) {
  if (!result) return null;

  const v = verdict(result.status);
  const isEligible = result.status === "likely_eligible";
  // Dollar figure ONLY for CalFresh when eligible, by grounding contract.
  const showBenefit = isEligible && result.monthly_benefit != null;
  const flip = Boolean(result.computation?.flip_federal_not_to_ca_eligible);

  return (
    <section style={{ textAlign: "start" }}>
      {/* Card 1 — what you likely qualify for */}
      <div style={card}>
        <h2 style={cardTitle}>What you likely qualify for</h2>

        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              background: v.color,
              color: "#06210d",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {v.label}
          </span>
          {showBenefit && (
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>
              ${result.monthly_benefit!.toLocaleString()}
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--mut)" }}>/mo</span>
            </span>
          )}
        </div>

        {/* The California 200% rescue: surfaced first when the federal 130% test
            fails but CA's broad-based categorical eligibility still qualifies. */}
        {flip && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid var(--accent)",
              background: "rgba(63, 185, 80, 0.10)",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            Your income is above the federal limit, but California uses a higher
            limit, so you can still qualify here.
          </div>
        )}

        {result.why?.length ? (
          <ul style={{ ...listReset, marginTop: 12, fontSize: 14, lineHeight: 1.5 }}>
            {result.why.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        ) : null}

        <CitationRow citations={result.citations} />

        {result.recommendations?.length ? (
          <div style={{ marginTop: 16 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "var(--mut)" }}>
              Other programs worth a look
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {result.recommendations.map((rec, i) => (
                <RecommendationCard key={`${rec.program}-${i}`} rec={rec} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Card 2 — what to bring to your interview */}
      <div style={card}>
        <h2 style={cardTitle}>What to bring to your interview</h2>
        <ul style={{ ...listReset, fontSize: 14, lineHeight: 1.5 }}>
          {BRING_TO_INTERVIEW.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Card 3 — what they will ask you */}
      <div style={card}>
        <h2 style={cardTitle}>What they will ask you</h2>
        <ul style={{ ...listReset, fontSize: 14, lineHeight: 1.5 }}>
          {WHAT_THEY_ASK.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Footer — disclaimer + navigator fallback, always shown */}
      <div style={{ padding: "4px 2px 2px", fontSize: 12, color: "var(--mut)", lineHeight: 1.5 }}>
        <p style={{ margin: 0 }}>
          {result.disclaimer || "Screening estimate, not an official eligibility determination."}
        </p>

        {result.navigator_fallback && (
          <div style={{ marginTop: 8 }}>
            {result.navigator_fallback.note && (
              <p style={{ margin: "0 0 6px" }}>{result.navigator_fallback.note}</p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              {result.navigator_fallback.url && (
                <a
                  href={result.navigator_fallback.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "8px 14px",
                    borderRadius: 999,
                    background: "var(--accent2)",
                    color: "#06210d",
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  {result.navigator_fallback.action || "Apply or talk to a navigator"}
                </a>
              )}
              {result.navigator_fallback.phone && (
                <a
                  href={`tel:${result.navigator_fallback.phone.replace(/[^\d+]/g, "")}`}
                  style={{ fontSize: 13, color: "var(--accent2)", whiteSpace: "nowrap" }}
                >
                  {result.navigator_fallback.phone}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
