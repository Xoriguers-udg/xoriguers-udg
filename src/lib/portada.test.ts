import { describe, expect, it } from 'vitest';
import { blocsDe, llegeixSeccions, SECCIONS_PORTADA } from './portada';

const claus = (s: { clau: string }[]) => s.map((x) => x.clau);

describe('llegeixSeccions', () => {
  it('shows every section, in the old order, when nothing is set', () => {
    expect(claus(llegeixSeccions(undefined))).toEqual(SECCIONS_PORTADA.map((s) => s.clau));
  });

  it('still reads the first form, an object of checkboxes, and the old headings', () => {
    const s = llegeixSeccions({ instagram: false, properes: true }, { presentacioTitol: 'Nosaltres' });
    expect(claus(s)).not.toContain('instagram');
    expect(s[0]).toEqual({ clau: 'presentacio', titol: 'Nosaltres' });
  });

  it('reads a row by the name the CMS stores, or by its key', () => {
    expect(claus(llegeixSeccions([{ seccio: 'Últims castells' }, { seccio: 'ultimscastells' }, { seccio: 'Activitats' }]))).toEqual([
      'ultimsCastells', 'activitats',
    ]);
  });

  it('follows the list: its order, its checkboxes, its headings', () => {
    const s = llegeixSeccions([
      { seccio: 'album', mostra: true, titol: '' },
      { seccio: 'ultimsCastells', mostra: true, titol: 'Els castells de l’última' },
      { seccio: 'instagram', amaga: true },
      { seccio: 'noticies', mostra: false },
      { seccio: 'album', mostra: true },
      { seccio: 'inventada', mostra: true },
    ]);
    expect(s).toEqual([
      { clau: 'album', titol: undefined },
      { clau: 'ultimsCastells', titol: 'Els castells de l’última' },
    ]);
  });
});

describe('blocsDe', () => {
  const de = (...c: string[]) => blocsDe(c.map((clau) => ({ clau })) as never);

  it('pairs Qui som and Pròximes actuacions when they are next to each other, in either order', () => {
    expect(de('presentacio', 'properes', 'album')).toEqual([
      { tipus: 'qui-som', presentacio: { clau: 'presentacio' }, properes: { clau: 'properes' } },
      { tipus: 'seccio', seccio: { clau: 'album' } },
    ]);
    expect(de('properes', 'presentacio')).toHaveLength(1);
  });

  it('gives each its own row when they are apart', () => {
    expect(de('presentacio', 'album', 'properes')).toEqual([
      { tipus: 'qui-som', presentacio: { clau: 'presentacio' }, properes: undefined },
      { tipus: 'seccio', seccio: { clau: 'album' } },
      { tipus: 'qui-som', presentacio: undefined, properes: { clau: 'properes' } },
    ]);
  });
});
