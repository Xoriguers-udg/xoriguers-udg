import { describe, expect, it } from 'vitest';
import { llegeixMenu, MENU_PER_DEFECTE, paginesApagades, resolEstructura } from './estructura';

const textos = (ll: { text: string }[]) => ll.map((e) => e.text);

describe('resolEstructura, with nothing set in the CMS', () => {
  const e = resolEstructura(undefined, { base: '/x/' });

  it('draws the bar as it was: the dropdown after Notícies, Botiga after it', () => {
    expect(e.barra.map((p) => (p.tipus === 'desplegable' ? '▾' : p.enllac.text))).toEqual([
      'Agenda', 'Historial', 'Galeria', 'Notícies', '▾', 'Botiga',
    ]);
    expect(textos(e.colla)).toEqual(['Qui som', 'Xorimúsics', 'Mallarengues']);
    expect(textos(e.organitzacio)).toEqual(['Junta tècnica', 'Junta directiva', 'Documents', 'Col·laboradors']);
    expect(e.boto).toEqual({
      barra: { text: 'Uneix-te', href: '/x/uneix-te', extern: false },
      peu: { text: 'Uneix-te a la colla', href: '/x/uneix-te', extern: false },
    });
  });

  it('draws the footer as it was', () => {
    expect(textos(e.peu.colla)).toEqual(['Qui som', 'Xorimúsics', 'Mallarengues']);
    expect(textos(e.peu.castells)).toEqual(['Agenda', 'Historial de castells', 'Galeria', 'Notícies']);
    expect(textos(e.peu.organitzacio)).toEqual(['Junta tècnica', 'Junta directiva', 'Documents', 'Col·laboradors', 'Botiga']);
    expect(e.peu.xarxes).toEqual([{ text: 'Contacta’ns', href: '/x/col-laboradors#contacte', extern: false }]);
  });

  it('keeps the old group names', () => {
    expect(e.noms.desplegable).toBe('La colla');
    expect(e.noms.peuXarxes).toBe('Segueix-nos');
  });
});

describe('switching pages off', () => {
  const e = resolEstructura({ apagades: { merchandising: true, 'col-laboradors': true, agenda: false } }, { base: '/' });

  it('drops every link to a page that is off, wherever it is', () => {
    expect(e.enllac('merchandising')).toBeUndefined();
    expect(e.enllac('agenda')).toBe('/agenda');
    expect(e.barra.some((p) => p.tipus === 'enllac' && p.enllac.text === 'Botiga')).toBe(false);
    expect(textos(e.organitzacio)).not.toContain('Col·laboradors');
    // Contacta'ns points into Col·laboradors, so it goes too
    expect(e.peu.xarxes).toEqual([]);
  });

  it('only switches off a page ticked as off, and one that exists', () => {
    expect([...paginesApagades({ apagades: { merchandising: true, galeria: false, inventada: true } })]).toEqual(['merchandising']);
    expect(paginesApagades(null).size).toBe(0);
  });

  it('leaves every page on when the form has no value for it, as the CMS saves an unticked box', () => {
    expect(paginesApagades({ apagades: {} }).size).toBe(0);
    expect(paginesApagades({ apagades: { agenda: null } }).size).toBe(0);
  });

  it('keeps a page that is on but empty out of the menus, without switching it off', () => {
    const buida = resolEstructura(undefined, { base: '/', buides: new Set(['noticies']) });
    expect(buida.activa('noticies')).toBe(true);
    expect(buida.enllac('noticies')).toBeUndefined();
    expect(textos(buida.peu.castells)).not.toContain('Notícies');
  });
});

describe('a menu edited in the CMS', () => {
  const dades = {
    menu: [
      { nom: 'Qui som', pagina: 'la-colla', lloc: 'colla', peu: 'colla' },
      { nom: 'Agenda', pagina: 'agenda', lloc: 'barra', peu: 'castells' },
      { nom: 'TikTok', pagina: 'adreca', adreca: 'https://www.tiktok.com/@xoriguers', lloc: 'barra', peu: 'xarxes' },
      { nom: 'Sense destinació', lloc: 'barra' },
      { nom: 'Fotos 2026', pagina: 'adreca', adreca: '/galeria/diada-de-primavera-2026', lloc: 'cap', peu: 'castells' },
    ],
    noms: { desplegable: 'Nosaltres', peuXarxes: '' },
  };
  const e = resolEstructura(dades, { base: '/x/' });

  it('puts the dropdown where its first entry is', () => {
    expect(e.barra.map((p) => (p.tipus === 'desplegable' ? '▾' : p.enllac.text))).toEqual(['▾', 'Agenda', 'TikTok']);
  });

  it('opens an outside address in a new tab and keeps a path inside the site', () => {
    expect(e.barra.at(-1)).toEqual({ tipus: 'enllac', enllac: { text: 'TikTok', href: 'https://www.tiktok.com/@xoriguers', extern: true } });
    expect(e.peu.castells.at(-1)).toEqual({ text: 'Fotos 2026', href: '/x/galeria/diada-de-primavera-2026', extern: false });
  });

  it('skips an entry with nowhere to go, and says so', () => {
    expect(llegeixMenu(dades).avisos).toEqual(['una entrada del menú sense destinació']);
  });

  it('has no button when no entry is one', () => {
    expect(e.boto).toBeUndefined();
  });

  it('takes the group names given, and the old one for an empty field', () => {
    expect(e.noms.desplegable).toBe('Nosaltres');
    expect(e.noms.peuXarxes).toBe('Segueix-nos');
  });

  it('falls back to the menu as it was when the list is empty', () => {
    expect(llegeixMenu({ menu: [] }).menu).toBe(MENU_PER_DEFECTE);
  });
});
