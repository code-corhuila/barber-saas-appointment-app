import { describe, expect, it } from 'vitest';
import { isApiError } from './shell-contract';

describe('shell contract', () => {
  it('recognises the errors the shell client rejects with, which carry the message to show', () => {
    expect(isApiError({ status: 404, code: 'NOT_FOUND', message: 'x', details: [], traceId: 't',
      userMessage: 'No encontramos lo que buscas.' })).toBe(true);
  });

  it('does not take any other failure for one', () => {
    expect(isApiError(new Error('boom'))).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError('NOT_FOUND')).toBe(false);
  });
});
