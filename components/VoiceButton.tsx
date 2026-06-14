'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createRecorder, transcribe } from '../lib/voice-client';

type RecorderHandle = ReturnType<typeof createRecorder>;
type Phase = 'idle' | 'recording' | 'busy';

const ERROR_RESET_MS = 3200;

function MicIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

export default function VoiceButton({
  onTranscript,
  disabled,
  lang,
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  lang?: string;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [status, setStatus] = useState<string>('');

  const recorderRef = useRef<RecorderHandle | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const clearErrorTimer = useCallback(() => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  }, []);

  const showError = useCallback(
    (message: string) => {
      if (!mountedRef.current) return;
      setPhase('idle');
      setStatus(message);
      clearErrorTimer();
      errorTimerRef.current = setTimeout(() => {
        if (mountedRef.current) setStatus('');
      }, ERROR_RESET_MS);
    },
    [clearErrorTimer]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearErrorTimer();
      if (recorderRef.current) {
        try {
          recorderRef.current.cancel();
        } catch {
          /* ignore */
        }
        recorderRef.current = null;
      }
    };
  }, [clearErrorTimer]);

  const startRecording = useCallback(async () => {
    clearErrorTimer();
    setStatus('');
    try {
      const rec = createRecorder();
      recorderRef.current = rec;
      await rec.start();
      if (!mountedRef.current) {
        try {
          rec.cancel();
        } catch {
          /* ignore */
        }
        recorderRef.current = null;
        return;
      }
      setPhase('recording');
      setStatus('Listening, tap to stop');
    } catch {
      recorderRef.current = null;
      showError('Microphone access is needed for voice');
    }
  }, [clearErrorTimer, showError]);

  const stopRecording = useCallback(async () => {
    const rec = recorderRef.current;
    if (!rec) {
      setPhase('idle');
      return;
    }
    setPhase('busy');
    setStatus('');
    try {
      const { base64, mime } = await rec.stop();
      recorderRef.current = null;
      const text = await transcribe(base64, mime);
      if (!mountedRef.current) return;
      const trimmed = (text || '').trim();
      if (trimmed) onTranscript(trimmed);
      setPhase('idle');
      setStatus('');
    } catch (err) {
      recorderRef.current = null;
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Could not transcribe, please try again';
      showError(message);
    }
  }, [onTranscript, showError]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    if (phase === 'busy') return;
    if (phase === 'recording') {
      void stopRecording();
    } else {
      void startRecording();
    }
  }, [disabled, phase, startRecording, stopRecording]);

  const isDisabled = Boolean(disabled) || phase === 'busy';

  const className =
    phase === 'recording'
      ? 'voice-btn recording'
      : phase === 'busy'
        ? 'voice-btn busy'
        : 'voice-btn';

  return (
    <div lang={lang}>
      <button
        type="button"
        className={className}
        aria-label="Speak your answer"
        aria-pressed={phase === 'recording'}
        aria-busy={phase === 'busy'}
        disabled={isDisabled}
        onClick={handleClick}
      >
        {phase === 'busy' ? <Spinner /> : <MicIcon />}
      </button>
      {status ? (
        <p className="voice-status" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}
    </div>
  );
}
