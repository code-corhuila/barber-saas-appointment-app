import { useCallback, useEffect, useState } from 'react';
import { isApiError } from '../shell-contract';

/** The four states every view shows (annex H): loading, error with retry, empty and data. */
export type Load<T> =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; data: T };

/** The shell already decided what the user reads for an API error; anything else gets a neutral text. */
export function messageOf(err: unknown, fallback: string): string {
  return isApiError(err) ? err.userMessage : fallback;
}

/**
 * Runs {@code load} when the view opens or a dependency changes, and again on reload(). A result
 * that arrives after the view moved on is ignored, so a slow answer never overwrites a newer one.
 */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[], fallback: string): [Load<T>, () => void] {
  const [result, setResult] = useState<Load<T>>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let current = true;
    setResult({ state: 'loading' });
    load().then(
      (data) => { if (current) setResult({ state: 'ready', data }); },
      (err) => { if (current) setResult({ state: 'error', message: messageOf(err, fallback) }); },
    );
    return () => { current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  return [result, reload];
}

/** A key per intent: kept while the same form is retried, renewed after it succeeds (norm 5.4.2). */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
