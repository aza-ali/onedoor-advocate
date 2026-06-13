'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

/**
 * Uploader — drag/drop or camera/file upload of a benefits document (or the demo pay stub),
 * posts it to /api/extract for server-side Claude-vision extraction, then renders an editable
 * confirm/correct form. On confirm it hands the corrected fields up via onExtracted. The
 * document is never stored. Fully localized (en / es / fa) via the `lang` prop.
 */

type Extracted = {
  county?: string; household_size?: number | string; monthly_earned_income?: number | string;
  monthly_unearned_income?: number | string; shelter_cost_monthly?: number | string;
  members?: unknown; extraction_notes?: string; needs_confirmation?: boolean; [k: string]: unknown;
};
type Phase = 'idle' | 'reading' | 'confirm' | 'error';

// Field order; labels/hints come from the dictionary.
const FIELD_KEYS = ['county', 'household_size', 'monthly_earned_income', 'monthly_unearned_income', 'shelter_cost_monthly'] as const;
const NUMERIC = new Set(['household_size', 'monthly_earned_income', 'monthly_unearned_income', 'shelter_cost_monthly']);

const UD: Record<string, any> = {
  en: {
    reading: 'Reading your document...', readingSub: 'This stays on the server just long enough to read it. It is not stored.',
    confirmH: 'Quick check', confirmSub: 'We pulled these out. Fix anything that looks off, then confirm.',
    looksRight: 'Looks right, use these', reupload: 'Re-upload',
    idleTitle: 'Add your pay stub or benefits letter', idleSub: 'Tap to take a photo or choose a file. Drag and drop works too.',
    demo: 'Use the demo pay stub', notStored: 'Your document is not stored.',
    dropAria: 'Upload a document. Tap to choose a file or take a photo.',
    err503: 'The document reader is not set up right now. You can try the demo pay stub below to see how this works.',
    errGeneric: 'Something went wrong reading your document. Please try again, or use the demo pay stub below.',
    errFile: 'Could not read that file. Please try another, or use the demo pay stub.',
    labels: { county: 'County', household_size: 'People in your household', monthly_earned_income: 'Monthly income from work', monthly_unearned_income: 'Other monthly income', shelter_cost_monthly: 'Monthly rent or mortgage' },
    hints: { county: 'Where you live', monthly_earned_income: 'Wages, before taxes', monthly_unearned_income: 'Benefits, support, etc.' },
  },
  es: {
    reading: 'Leyendo su documento...', readingSub: 'Permanece en el servidor solo el tiempo necesario para leerlo. No se guarda.',
    confirmH: 'Revisión rápida', confirmSub: 'Extrajimos esto. Corrija lo que no esté bien y confirme.',
    looksRight: 'Está bien, usar estos', reupload: 'Subir de nuevo',
    idleTitle: 'Agregue su talón de pago o carta de beneficios', idleSub: 'Toque para tomar una foto o elegir un archivo. También puede arrastrar y soltar.',
    demo: 'Usar el talón de pago de demostración', notStored: 'Su documento no se guarda.',
    dropAria: 'Subir un documento. Toque para elegir un archivo o tomar una foto.',
    err503: 'El lector de documentos no está configurado ahora. Puede probar el talón de demostración para ver cómo funciona.',
    errGeneric: 'Algo salió mal al leer su documento. Intente de nuevo o use el talón de demostración.',
    errFile: 'No se pudo leer ese archivo. Pruebe otro o use el talón de demostración.',
    labels: { county: 'Condado', household_size: 'Personas en su hogar', monthly_earned_income: 'Ingreso mensual del trabajo', monthly_unearned_income: 'Otro ingreso mensual', shelter_cost_monthly: 'Renta o hipoteca mensual' },
    hints: { county: 'Dónde vive', monthly_earned_income: 'Salario, antes de impuestos', monthly_unearned_income: 'Beneficios, ayuda, etc.' },
  },
  fa: {
    reading: 'در حال خواندن سند شما...', readingSub: 'فقط به اندازه‌ای روی سرور می‌ماند که خوانده شود. ذخیره نمی‌شود.',
    confirmH: 'بررسی سریع', confirmSub: 'این موارد را استخراج کردیم. هر چیزی که درست نیست را اصلاح و تأیید کنید.',
    looksRight: 'درست است، استفاده کن', reupload: 'بارگذاری دوباره',
    idleTitle: 'فیش حقوقی یا نامه مزایای خود را اضافه کنید', idleSub: 'برای گرفتن عکس یا انتخاب فایل ضربه بزنید. کشیدن و رها کردن هم کار می‌کند.',
    demo: 'استفاده از فیش حقوقی نمونه', notStored: 'سند شما ذخیره نمی‌شود.',
    dropAria: 'بارگذاری سند. برای انتخاب فایل یا گرفتن عکس ضربه بزنید.',
    err503: 'خواننده سند در حال حاضر تنظیم نشده است. می‌توانید فیش نمونه زیر را امتحان کنید تا نحوه کار را ببینید.',
    errGeneric: 'هنگام خواندن سند مشکلی پیش آمد. دوباره تلاش کنید یا از فیش نمونه استفاده کنید.',
    errFile: 'آن فایل خوانده نشد. فایل دیگری را امتحان کنید یا از فیش نمونه استفاده کنید.',
    labels: { county: 'شهرستان', household_size: 'تعداد افراد خانوار', monthly_earned_income: 'درآمد ماهانه از کار', monthly_unearned_income: 'سایر درآمد ماهانه', shelter_cost_monthly: 'اجاره یا وام مسکن ماهانه' },
    hints: { county: 'محل زندگی شما', monthly_earned_income: 'دستمزد، پیش از کسر مالیات', monthly_unearned_income: 'مزایا، کمک‌هزینه و غیره' },
  },
};

const ACCEPT = 'image/*,application/pdf';

function readAsBase64(file: File): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read-failed'));
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      const base64 = comma >= 0 ? result.slice(comma + 1) : result;
      const mime = file.type || (/\.pdf$/i.test(file.name) ? 'application/pdf' : 'application/octet-stream');
      resolve({ base64, mime });
    };
    reader.readAsDataURL(file);
  });
}

export default function Uploader({ onExtracted, lang = 'en' }: { onExtracted: (fields: Record<string, any>) => void; lang?: string }) {
  const d = UD[lang] || UD.en;
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [dragging, setDragging] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [note, setNote] = useState<string>(d.notStored);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const toForm = useCallback((ex: Extracted) => {
    const next: Record<string, string> = {};
    for (const k of FIELD_KEYS) { const v = ex[k]; next[k] = v === undefined || v === null ? '' : String(v); }
    setFields(next);
  }, []);

  const callExtract = useCallback(
    async (body: Record<string, unknown>) => {
      setPhase('reading'); setErrorMsg('');
      try {
        const res = await fetch('/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) { throw new Error(res.status === 503 ? d.err503 : d.errGeneric); }
        const data = await res.json();
        const ex: Extracted = (data && data.extracted) || {};
        toForm(ex);
        setNote(d.notStored);
        setPhase('confirm');
      } catch (err) {
        setErrorMsg(err instanceof Error && err.message !== 'read-failed' ? err.message : d.errGeneric);
        setPhase('error');
      }
    },
    [toForm, d],
  );

  const handleFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      setPhase('reading'); setErrorMsg('');
      try { const { base64, mime } = await readAsBase64(file); await callExtract({ document_base64: base64, mime }); }
      catch { setErrorMsg(d.errFile); setPhase('error'); }
    },
    [callExtract, d],
  );

  const onDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer?.files?.[0]); }, [handleFile]);
  const reset = useCallback(() => { setPhase('idle'); setErrorMsg(''); setFields({}); if (inputRef.current) inputRef.current.value = ''; }, []);

  const onConfirm = useCallback(() => {
    const out: Record<string, any> = {};
    for (const k of FIELD_KEYS) {
      const raw = (fields[k] ?? '').trim();
      if (raw === '') continue;
      if (NUMERIC.has(k)) { const n = Number(raw.replace(/[$,\s]/g, '')); out[k] = Number.isFinite(n) ? n : raw; }
      else out[k] = raw;
    }
    out.needs_confirmation = false;
    onExtracted(out);
  }, [fields, onExtracted]);

  const fieldDefs = useMemo(() => FIELD_KEYS.map((k) => ({ key: k, label: d.labels[k], hint: d.hints[k], numeric: NUMERIC.has(k) })), [d]);

  // ---- render ----
  if (phase === 'reading') {
    return (
      <section className="ud" aria-busy="true">
        <div className="ud-busy">
          <span className="ud-spinner" aria-hidden="true" />
          <p className="ud-busy-text">{d.reading}</p>
          <p className="ud-sub">{d.readingSub}</p>
        </div>
      </section>
    );
  }

  if (phase === 'confirm') {
    return (
      <section className="ud">
        <h2 className="ud-h">{d.confirmH}</h2>
        <p className="ud-sub">{d.confirmSub}</p>
        <form className="ud-form" onSubmit={(e) => { e.preventDefault(); onConfirm(); }}>
          {fieldDefs.map((f) => (
            <label key={f.key} className="ud-field">
              <span className="ud-label">{f.label}</span>
              {f.hint ? <span className="ud-hint">{f.hint}</span> : null}
              <input
                className="ud-input"
                type="text"
                inputMode={f.numeric ? 'decimal' : 'text'}
                value={fields[f.key] ?? ''}
                onChange={(e) => setFields((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.numeric ? '0' : ''}
                autoComplete="off"
              />
            </label>
          ))}
          <p className="ud-note" role="note">{note}</p>
          <div className="ud-actions">
            <button type="submit" className="ud-btn ud-btn-primary">{d.looksRight}</button>
            <button type="button" className="ud-btn ud-btn-ghost" onClick={reset}>{d.reupload}</button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="ud">
      <div
        className={`ud-drop${dragging ? ' is-drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={d.dropAria}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
      >
        <div className="ud-drop-icon" aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
            <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
          </svg>
        </div>
        <p className="ud-drop-title">{d.idleTitle}</p>
        <p className="ud-sub">{d.idleSub}</p>
        <input ref={inputRef} type="file" accept={ACCEPT} capture="environment" className="ud-file" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>

      <button type="button" className="ud-btn ud-btn-ghost ud-demo" onClick={() => callExtract({ fixture: 'paystub' })}>{d.demo}</button>

      {phase === 'error' && errorMsg ? <div className="ud-err" role="alert">{errorMsg}</div> : null}

      <p className="ud-note ud-note-quiet" role="note">{d.notStored}</p>
    </section>
  );
}
