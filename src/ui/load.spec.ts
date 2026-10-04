import { describe, expect, it } from 'vitest';
import { messageOf, newIdempotencyKey } from './load';

describe('load', () => {
  it('shows the message the shell decided for an API error, and a neutral one for anything else', () => {
    const apiError = { status: 503, code: 'SERVICE_UNAVAILABLE', message: 'x', details: [], traceId: 't',
      userMessage: 'El servicio no está disponible. Intenta más tarde.' };

    expect(messageOf(apiError, 'fallback')).toBe('El servicio no está disponible. Intenta más tarde.');
    expect(messageOf(new TypeError('Failed to fetch'), 'No se pudieron cargar tus citas.'))
      .toBe('No se pudieron cargar tus citas.');
  });

  it('gives every intent its own idempotency key within the length the contract accepts', () => {
    const a = newIdempotencyKey();
    const b = newIdempotencyKey();

    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(8);
    expect(a.length).toBeLessThanOrEqual(128);
  });
});
