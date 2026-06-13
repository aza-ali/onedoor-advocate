"use client";

import type { ScreenResult } from "../lib/types";

// The generative answer. Driven entirely by the engine's localized `presentation` card, so
// when the language changes and the answer is regenerated, this whole surface re-renders in
// that language with the dollar figures and citations unchanged. Only CalFresh shows a dollar.

const pillClass = (status: string) =>
  status === "likely_eligible" ? "pill ok" : status === "likely_not_eligible" ? "pill no" : "pill maybe";

function Cite({ id, url }: { id: string; url?: string | null }) {
  if (url) return <a className="chip" href={url} target="_blank" rel="noreferrer">{id}</a>;
  return <span className="chip">{id}</span>;
}

export default function Outputs({ result }: { result: ScreenResult | null }) {
  if (!result) return null;
  const p: any = result.presentation || {};
  const cites = result.citations || [];
  const eligible = result.status === "likely_eligible";

  return (
    <div className="answer">
      {/* 1 — the verdict (the only card with a dollar figure) */}
      <section className="card hero">
        <div className="card-kicker"><span className="dot" />{p.sec_qualify || "What you likely qualify for"}</div>
        <div className="verdict-row">
          <span className={pillClass(result.status)}>{p.verdict_label || result.status}</span>
          {p.amount != null && (
            <span className="amount">${p.amount}<span className="per"> {p.per_mo || "/mo"}</span></span>
          )}
        </div>
        {Array.isArray(p.why) && p.why.length > 0 && (
          <div className="why">
            {p.why.map((w: any, i: number) => (
              <div key={i} className={`why-item${w.kind === "flip" ? " flip" : ""}`}>
                <span className="ic" aria-hidden>{w.kind === "flip" ? "✦" : w.kind === "over" ? "•" : "→"}</span>
                <span>{w.text}</span>
              </div>
            ))}
          </div>
        )}
        {cites.length > 0 && (
          <div className="cites">
            {cites.slice(0, 8).map((c, i) => <Cite key={i} id={c.source_id} url={c.source_url} />)}
          </div>
        )}
      </section>

      {/* 2 — other programs (cited, never a dollar figure) */}
      {Array.isArray(p.recs) && p.recs.length > 0 && (
        <section className="card">
          <div className="card-kicker"><span className="dot" />{p.sec_also || "You may also qualify for"}</div>
          <div className="recs">
            {p.recs.map((r: any, i: number) => (
              <div className="rec" key={i}>
                <span className="name">{r.program}</span>
                <span className="reason">{r.reason}</span>
                <span className="step">{r.next_step}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3 — bring + ask (the advocate prep), only when eligible */}
      {eligible && Array.isArray(p.bring) && (
        <section className="card">
          <div className="card-kicker"><span className="dot" />{p.sec_bring || "What to bring to your interview"}</div>
          <ul className="checklist">
            {p.bring.map((b: string, i: number) => (
              <li key={i}><span className="ic" aria-hidden>✓</span><span>{b}</span></li>
            ))}
          </ul>
        </section>
      )}
      {eligible && Array.isArray(p.ask) && (
        <section className="card">
          <div className="card-kicker"><span className="dot" />{p.sec_ask || "What they will ask you"}</div>
          <ul className="checklist">
            {p.ask.map((a: string, i: number) => (
              <li key={i}><span className="ic" aria-hidden>?</span><span>{a}</span></li>
            ))}
          </ul>
        </section>
      )}

      {/* footer — disclaimer + navigator fallback */}
      <p className="note-foot">
        {p.disclaimer || result.disclaimer}
        {p.navigator?.phone && (
          <>
            {"  "}
            <a className="nav" href={`tel:${String(p.navigator.phone).replace(/[^0-9+]/g, "")}`}>
              {p.talk_navigator || "Apply or talk to a navigator"}: {p.navigator.phone}
            </a>
          </>
        )}
      </p>
    </div>
  );
}
