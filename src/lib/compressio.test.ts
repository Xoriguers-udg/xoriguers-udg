import { describe, expect, it } from 'vitest';
import { COSTAT_MAXIM, MIDA_BONA, planifica } from './compressio';

describe('planifica', () => {
  it('shrinks a phone photo that is too big on both counts', () => {
    expect(planifica({ amplada: 4032, alcada: 3024, bytes: 5_000_000, format: 'jpeg' })).toEqual({ redimensiona: true });
  });

  it('resizes by the longest side, portrait or landscape', () => {
    expect(planifica({ amplada: 1500, alcada: COSTAT_MAXIM + 1, bytes: 100_000, format: 'jpeg' })).toEqual({ redimensiona: true });
  });

  it('re-encodes a heavy image that is already the right size', () => {
    expect(planifica({ amplada: 1600, alcada: 1200, bytes: MIDA_BONA + 1, format: 'jpeg' })).toEqual({ redimensiona: false });
  });

  it('leaves an image that is already small and light alone', () => {
    expect(planifica({ amplada: COSTAT_MAXIM, alcada: 1200, bytes: MIDA_BONA, format: 'jpeg' })).toBeNull();
  });

  it('never touches an image it has already processed, however heavy', () => {
    expect(planifica({ amplada: 2000, alcada: 1500, bytes: 900_000, format: 'jpeg', marcada: true })).toBeNull();
  });

  it('handles png and webp, and never touches other formats', () => {
    expect(planifica({ amplada: 3000, alcada: 2000, bytes: 3_000_000, format: 'png' })).not.toBeNull();
    expect(planifica({ amplada: 3000, alcada: 2000, bytes: 3_000_000, format: 'webp' })).not.toBeNull();
    expect(planifica({ amplada: 3000, alcada: 2000, bytes: 3_000_000, format: 'gif' })).toBeNull();
    expect(planifica({ amplada: 3000, alcada: 2000, bytes: 3_000_000, format: 'svg' })).toBeNull();
  });
});
