import { describe, expect, it } from 'vitest';
import { enllacDiada, teFitxa } from './fitxa';

const buida = { nom: 'ACTUACIÓ EMBOS', castells: [], collesParticipants: [] };

describe('teFitxa', () => {
  it('gives no page to an entry the row already says everything about', () => {
    expect(teFitxa({ data: buida })).toBe(false);
    expect(teFitxa({ body: '\n  \n', data: { ...buida, castells: [{}, { foto: '' }] } })).toBe(false);
  });

  it('gives no page for a field the CMS saved empty', () => {
    expect(teFitxa({ data: { cartell: null, collesParticipants: null, castells: null } })).toBe(false);
    expect(teFitxa({ data: { cartell: '', collesParticipants: [''], castells: [{ foto: null }] } })).toBe(false);
  });

  it.each([
    ['a photo of one castell', { data: { ...buida, castells: [{}, { foto: '/images/uploads/3d7.jpg' }] } }],
    ['a poster', { data: { ...buida, cartell: '/images/uploads/cartell.jpg' } }],
    ['a text', { body: 'Una tarda de pluja.', data: buida }],
    ['the colles that took part', { data: { ...buida, collesParticipants: ['Marracos'] } }],
  ])('gives a page to an entry with %s', (_, entry) => {
    expect(teFitxa(entry)).toBe(true);
  });
});

describe('enllacDiada', () => {
  it('links to the page when there is one, and to the row when there is not', () => {
    const ambFoto = { id: 'barraques', data: { castells: [{ foto: 'x.jpg' }] } };
    expect(enllacDiada('/x/', ambFoto)).toBe('/x/agenda/barraques');
    expect(enllacDiada('/x/', { id: 'embos', data: buida })).toBe('/x/castells#d-embos');
    // with the historial switched off, a diada without a page links nowhere
    expect(enllacDiada('/x/', { id: 'embos', data: buida }, false)).toBeUndefined();
    expect(enllacDiada('/x/', ambFoto, false)).toBe('/x/agenda/barraques');
  });
});
