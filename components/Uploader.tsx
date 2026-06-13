'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Uploader — drag/drop or camera/file upload of a benefits document (or the
 * demo pay stub), posts it to /api/extract for server-side Claude-vision
 * extraction, then renders an editable confirm/correct form. On confirm it
 * hands the corrected fields up via onExtracted. The document is never stored.
 */

type Extracted = {
  county?: string;
  household_size?: number | string;
  monthly_earned_income?: number | string;
  monthly_unearned_income?: number | string;
  shelter_cost_monthly?: number | string;
  members?: unknown;
  extraction_notes?: string;
  needs_confirmation?: boolean;
  [k: string]: unknown;
};

type Phase = 'idle' | 'reading' | 'confirm' | 'error';

// The fields we surface as editable inputs, in display order.
const FIELDS: { key: string; label: string; kind: 'text' | 'number'; hint?: string }[] = [
  { key: 'county', label: 'County', kind: 'text', hint: 'Where you live' },
  { key: 'household_size', label: 'People in your household', kind: 'number' },
  { key: 'monthly_earned_income', label: 'Monthly income from work', kind: 'number', hint: 'Wages, before taxes' },
  { key: 'monthly_unearned_income', label: 'Other monthly income', kind: 'number', hint: 'Benefits, support, etc.' },
  { key: 'shelter_cost_monthly', label: 'Monthly rent or mortgage', kind: 'number' },
];

const ACCEPT = 'image/*,application/pdf';

function readAsBase64(file: File): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file. Please try another.'));
    reader.onload = () => {
      const result = String(reader.result || '');
      // Strip the "data:<mime>;base64," prefix; keep only the payload.
      const comma = result.indexOf(',');
      const base64 = comma >= 0 ? result.slice(comma + 1) : result;
      const mime = file.type || (/\.pdf$/i.test(file.name) ? 'application/pdf' : 'application/octet-stream');
      resolve({ base64, mime });
    };
    reader.readAsDataURL(file);
  });
}

export default function Uploader({ onExtracted }: { onExtracted: (fields: Record<string, any>) => void }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [dragging, setDragging] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [note, setNote] = useState<string>('Your document is not stored.');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const toForm = useCallback((ex: Extracted) => {
    const next: Record<string, string> = {};
    for (const f of FIELDS) {
      const v = ex[f.key];
      next[f.key] = v === undefined || v === null ? '' : String(v);
    }
    setFields(next);
  }, []);

  const callExtract = useCallback(
    async (body: Record<string, unknown>) => {
      setPhase('reading');
      setErrorMsg('');
      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          let detail = '';
          try {
            const j = await res.json();
            detail = j?.error || j?.note || j?.message || '';
          } catch {
            /* non-JSON error body */
          }
          if (res.status === 503) {
            throw new Error(
              detail ||
                'The document reader is not set up right now. You can try the demo pay stub below to see how this works.',
            );
          }
          throw new Error(
            detail || 'Something went wrong reading your document. Please try again, or use the demo pay stub below.',
          );
        }

        const data = await res.json();
        const ex: Extracted = (data && data.extracted) || {};
        toForm(ex);
        if (data?.note && typeof data.note === 'string') setNote(data.note);
        else setNote('Your document is not stored.');
        setPhase('confirm');
      } catch (err) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again, or use the demo pay stub below.',
        );
        setPhase('error');
      }
    },
    [toForm],
  );

  const handleFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      setPhase('reading');
      setErrorMsg('');
      try {
        const { base64, mime } = await readAsBase64(file);
        await callExtract({ document_base64: base64, mime });
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Could not read that file. Please try another, or use the demo pay stub.',
        );
        setPhase('error');
      }
    },
    [callExtract],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer?.files?.[0];
      handleFile(file);
    },
    [handleFile],
  );

  const reset = useCallback(() => {
    setPhase('idle');
    setErrorMsg('');
    setFields({});
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const onConfirm = useCallback(() => {
    // Coerce numeric fields back to numbers where the user left a parseable value.
    const out: Record<string, any> = {};
    for (const f of FIELDS) {
      const raw = (fields[f.key] ?? '').trim();
      if (raw === '') continue;
      if (f.kind === 'number') {
        const n = Number(raw.replace(/[$,\s]/g, ''));
        out[f.key] = Number.isFinite(n) ? n : raw;
      } else {
        out[f.key] = raw;
      }
    }
    out.needs_confirmation = false;
    onExtracted(out);
  }, [fields, onExtracted]);

  // ---- render ----

  if (phase === 'reading') {
    return (
      <section className="ud" aria-busy="true">
        <div className="ud-busy">
          <span className="ud-spinner" aria-hidden="true" />
          <p className="ud-busy-text">Reading your document...</p>
          <p className="ud-sub">This stays on the server just long enough to read it. It is not stored.</p>
        </div>
        {styles}
      </section>
    );
  }

  if (phase === 'confirm') {
    return (
      <section className="ud">
        <h2 className="ud-h">Quick check</h2>
        <p className="ud-sub">We pulled these out. Fix anything that looks off, then confirm.</p>
        <form
          className="ud-form"
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm();
          }}
        >
          {FIELDS.map((f) => (
            <label key={f.key} className="ud-field">
              <span className="ud-label">{f.label}</span>
              {f.hint ? <span className="ud-hint">{f.hint}</span> : null}
              <input
                className="ud-input"
                type={f.kind === 'number' ? 'text' : 'text'}
                inputMode={f.kind === 'number' ? 'decimal' : 'text'}
                value={fields[f.key] ?? ''}
                onChange={(e) => setFields((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.kind === 'number' ? '0' : ''}
                autoComplete="off"
              />
            </label>
          ))}
          <p className="ud-note" role="note">
            {note}
          </p>
          <div className="ud-actions">
            <button type="submit" className="ud-btn ud-btn-primary">
              Looks right, use these
            </button>
            <button type="button" className="ud-btn ud-btn-ghost" onClick={reset}>
              Re-upload
            </button>
          </div>
        </form>
        {styles}
      </section>
    );
  }

  // idle + error share the upload affordance
  return (
    <section className="ud">
      <div
        className={`ud-drop${dragging ? ' is-drag' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload a document. Tap to choose a file or take a photo."
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <div className="ud-drop-icon" aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
            <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
          </svg>
        </div>
        <p className="ud-drop-title">Add your pay stub or benefits letter</p>
        <p className="ud-sub">Tap to take a photo or choose a file. Drag and drop works too.</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          capture="environment"
          className="ud-file"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      <button type="button" className="ud-btn ud-btn-ghost ud-demo" onClick={() => callExtract({ fixture: 'paystub' })}>
        Use the demo pay stub
      </button>

      {phase === 'error' && errorMsg ? (
        <div className="ud-err" role="alert">
          {errorMsg}
        </div>
      ) : null}

      <p className="ud-note ud-note-quiet" role="note">
        Your document is not stored.
      </p>
      {styles}
    </section>
  );
}

const styles = (
  <style jsx>{`
    .ud {
      display: flex;
      flex-direction: column;
      gap: 14px;
      width: 100%;
      max-width: 100%;
    }
    .ud * {
      max-width: 100%;
    }
    .ud-h {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .ud-sub {
      margin: 0;
      color: var(--mut);
      font-size: 14px;
    }
    .ud-drop {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-align: center;
      padding: 28px 18px;
      border: 1.5px dashed var(--line);
      border-radius: var(--radius);
      background: var(--panel);
      color: var(--ink);
      cursor: pointer;
      transition: border-color 0.15s ease, background 0.15s ease;
      min-height: 168px;
      justify-content: center;
    }
    .ud-drop:hover,
    .ud-drop:focus-visible {
      border-color: var(--accent2);
      outline: none;
    }
    .ud-drop.is-drag {
      border-color: var(--accent);
      background: var(--panel2);
    }
    .ud-drop-icon {
      color: var(--accent2);
    }
    .ud-drop-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    .ud-file {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    .ud-btn {
      appearance: none;
      width: 100%;
      min-height: 52px;
      padding: 14px 18px;
      border-radius: var(--radius);
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: filter 0.12s ease, background 0.12s ease;
      border: 1px solid transparent;
    }
    .ud-btn:active {
      filter: brightness(0.95);
    }
    .ud-btn-primary {
      background: var(--accent);
      color: #06210d;
      border-color: var(--accent);
    }
    .ud-btn-ghost {
      background: var(--panel);
      color: var(--ink);
      border-color: var(--line);
    }
    .ud-btn-ghost:hover,
    .ud-btn-ghost:focus-visible {
      border-color: var(--accent2);
      outline: none;
    }
    .ud-demo {
      margin-top: -2px;
    }
    .ud-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .ud-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ud-label {
      font-size: 14px;
      font-weight: 600;
    }
    .ud-hint {
      font-size: 12px;
      color: var(--mut);
    }
    .ud-input {
      width: 100%;
      min-height: 50px;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: var(--panel2);
      color: var(--ink);
      font-size: 16px; /* >=16px stops iOS zoom-on-focus */
    }
    .ud-input:focus {
      outline: none;
      border-color: var(--accent2);
    }
    .ud-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 4px;
    }
    .ud-note {
      margin: 0;
      font-size: 13px;
      color: var(--mut);
    }
    .ud-note-quiet {
      text-align: center;
    }
    .ud-err {
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid var(--bad);
      background: rgba(248, 81, 73, 0.08);
      color: var(--ink);
      font-size: 14px;
    }
    .ud-busy {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      text-align: center;
      padding: 40px 18px;
    }
    .ud-busy-text {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    .ud-spinner {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 3px solid var(--line);
      border-top-color: var(--accent);
      animation: ud-spin 0.8s linear infinite;
    }
    @keyframes ud-spin {
      to {
        transform: rotate(360deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .ud-spinner {
        animation-duration: 2s;
      }
    }
  `}</style>
);
