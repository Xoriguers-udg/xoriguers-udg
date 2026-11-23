import { describe, expect, it } from 'vitest';
import { alHistorial, CATEGORIES_PER_DEFECTE, categoriaDe, llegeixCategories, reglesDe, tipusSincronitzat } from './categories';
import { classificaEsdeveniment } from './esdeveniment';

describe('llegeixCategories', () => {
  it('reads the categories as the CMS writes them', () => {
    const { categories, perDefecte, avisos } = llegeixCategories({
      categories: [
        { nom: 'Assaig', clau: 'Assaig', paraules: 'assaig, assajos, xorifit', color: 'gris', agenda: false, historial: 'ambCastells' },
        { nom: 'Cercavila', clau: 'cercavila', paraules: 'cercavila, passacarrer', color: 'groc', agenda: true, historial: 'mai' },
      ],
      tipusPerDefecte: 'cercavila',
    });
    expect(avisos).toEqual([]);
    expect(categories).toHaveLength(2);
    expect(categories[0]).toEqual({ clau: 'Assaig', nom: 'Assaig', paraules: ['assaig', 'assajos', 'xorifit'], color: 'gris', agenda: false, historial: 'ambCastells' });
    expect(categories[1].paraules).toEqual(['cercavila', 'passacarrer']);
    expect(perDefecte).toBe('cercavila');
  });

  it('fills in what a half-edited category lacks', () => {
    const { categories } = llegeixCategories({ categories: [{ nom: 'Sopar' }] });
    expect(categories).toEqual([{ clau: 'Sopar', nom: 'Sopar', paraules: [], color: 'blau', agenda: true, historial: 'sempre' }]);
  });

  it('skips a category with no name or key, and a repeated key, and says so', () => {
    const { categories, avisos } = llegeixCategories({
      categories: [{ nom: 'Diada', clau: 'Diada' }, { paraules: 'res' }, { nom: 'Diades', clau: 'diada' }],
    });
    expect(categories.map((c) => c.nom)).toEqual(['Diada']);
    expect(avisos).toHaveLength(2);
  });

  it('falls back to the built-in categories when the file has none', () => {
    expect(llegeixCategories(undefined).categories).toBe(CATEGORIES_PER_DEFECTE);
    expect(llegeixCategories({ categories: [] }).perDefecte).toBe('Actuacio');
  });

  it('keeps the default category valid even when it was deleted', () => {
    const { perDefecte } = llegeixCategories({ categories: [{ nom: 'Diada', clau: 'Diada' }], tipusPerDefecte: 'Actuacio' });
    expect(perDefecte).toBe('Diada');
  });
});

describe('categoriaDe', () => {
  it('finds a category by its key, without case or accents', () => {
    expect(categoriaDe('actuació', CATEGORIES_PER_DEFECTE).nom).toBe('Actuació');
    expect(categoriaDe('ASSAIG', CATEGORIES_PER_DEFECTE).color).toBe('gris');
  });

  it('shows an entry whose category was deleted, under its own key', () => {
    expect(categoriaDe('Fira', CATEGORIES_PER_DEFECTE)).toEqual({ clau: 'Fira', nom: 'Fira', paraules: [], color: 'blau', agenda: true, historial: 'sempre' });
  });
});

describe('alHistorial', () => {
  const [assaig, diada] = CATEGORIES_PER_DEFECTE;

  it('keeps the old rule by default: an assaig only with castells', () => {
    expect(alHistorial(assaig, 0)).toBe(false);
    expect(alHistorial(assaig, 2)).toBe(true);
    expect(alHistorial(diada, 0)).toBe(true);
  });

  it('never lists a category set to «mai»', () => {
    expect(alHistorial({ ...diada, historial: 'mai' }, 5)).toBe(false);
  });
});

describe('the built-in categories classify as before', () => {
  const regles = reglesDe(CATEGORIES_PER_DEFECTE);
  it.each([
    ['ASSAIG CASTELLERS', 'Assaig'],
    ['Diada hivern Xoriguers', 'Diada'],
    ['Trobada Interiuta', 'Trobada'],
    ['ACTUACIÓ EMBOS', 'Actuacio'],
    ['OCTOBERFEST', 'Actuacio'],
  ])('%s → %s', (nom, tipus) => {
    expect(classificaEsdeveniment(nom, regles, 'Actuacio')).toBe(tipus);
  });
});

describe('tipusSincronitzat', () => {
  const ambEvent = llegeixCategories({
    categories: [
      { nom: 'Actuació', clau: 'Actuacio', paraules: 'actuació' },
      { nom: 'Event', clau: 'event', paraules: 'October, Barraques', historial: 'mai' },
    ],
    tipusPerDefecte: 'Actuacio',
  });

  it('moves an event already imported when the words change', () => {
    // OCTOBERFEST, filed as Actuació before «October» was a word, with no note yet
    expect(tipusSincronitzat('OCTOBERFEST', { tipus: 'Actuacio' }, ambEvent)).toEqual({ tipus: 'event', tipusCalendari: 'event' });
    expect(tipusSincronitzat('OCTOBERFEST', { tipus: 'Actuacio', tipusCalendari: 'Actuacio' }, ambEvent)).toEqual({ tipus: 'event', tipusCalendari: 'event' });
  });

  it('keeps the order of the categories: the first one whose word matches wins', () => {
    expect(tipusSincronitzat('ACTUACIÓ BARRAQUES', {}, ambEvent)?.tipus).toBe('Actuacio');
  });

  it('leaves a category chosen by hand in the CMS', () => {
    expect(tipusSincronitzat('OCTOBERFEST', { tipus: 'Actuacio', tipusCalendari: 'event' }, ambEvent)).toBeNull();
  });

  it('compares keys without case or accents', () => {
    expect(tipusSincronitzat('OCTOBERFEST', { tipus: 'EVENT', tipusCalendari: 'event' }, ambEvent)).toEqual({ tipus: 'event', tipusCalendari: 'event' });
  });
});
