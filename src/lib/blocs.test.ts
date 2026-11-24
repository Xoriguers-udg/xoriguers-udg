import { describe, expect, it } from 'vitest';
import { llegeixBlocs } from './blocs';

describe('llegeixBlocs', () => {
  it('reads each kind as the CMS stores it', () => {
    expect(
      llegeixBlocs([
        { type: 'text', text: 'Hola', html: '<p>Hola</p>' },
        { type: 'foto', imatge: '/images/uploads/a.jpg', peu: 'La pinya', ample: true },
        { type: 'fotoText', imatge: '/images/uploads/b.jpg', text: 'x', html: '<p>x</p>', costat: 'dreta' },
        { type: 'boto', text: 'Apunta-t’hi', pagina: 'uneix-te' },
        { type: 'boto', text: 'Inscripcions', pagina: 'adreca', adreca: 'https://forms.example.org' },
        { type: 'mapa', ubicacio: 'Plaça del Vi, Girona' },
        { type: 'album', album: 'diada-de-primavera-2026' },
        { type: 'documents', categoria: 'Protocol', titol: 'Protocols' },
      ])
    ).toEqual([
      { tipus: 'text', html: '<p>Hola</p>' },
      { tipus: 'foto', imatge: '/images/uploads/a.jpg', peu: 'La pinya', ample: true },
      { tipus: 'fotoText', imatge: '/images/uploads/b.jpg', html: '<p>x</p>', costat: 'dreta' },
      { tipus: 'boto', text: 'Apunta-t’hi', desti: 'uneix-te' },
      { tipus: 'boto', text: 'Inscripcions', desti: 'https://forms.example.org' },
      { tipus: 'mapa', ubicacio: 'Plaça del Vi, Girona', titol: undefined },
      { tipus: 'album', album: 'diada-de-primavera-2026' },
      { tipus: 'documents', categoria: 'Protocol', titol: 'Protocols' },
    ]);
  });

  it('skips a block missing what it needs, or of a kind it does not know', () => {
    expect(
      llegeixBlocs([
        { type: 'text', text: '   ' },
        { type: 'foto', peu: 'sense foto' },
        { type: 'fotoText', imatge: '/x.jpg' },
        { type: 'boto', text: 'Enlloc', pagina: 'adreca', adreca: '' },
        { type: 'video', url: 'https://youtube.com' },
        null,
      ])
    ).toEqual([]);
  });

  it('takes every document when no category is chosen', () => {
    expect(llegeixBlocs([{ type: 'documents', categoria: '' }])).toEqual([{ tipus: 'documents', categoria: undefined, titol: undefined }]);
  });

  it('reads nothing from something that is not a list', () => {
    expect(llegeixBlocs({ type: 'text' })).toEqual([]);
    expect(llegeixBlocs(undefined)).toEqual([]);
  });
});
