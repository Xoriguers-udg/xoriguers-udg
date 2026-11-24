/**
 * The site's structure as the colla sets it in the CMS (Configuració →
 * Estructura del web, stored in src/content/configuracio/estructura.md):
 * which pages are switched on, and one ordered list of menu entries that the
 * bar, its dropdown, the phone menu and the footer are all drawn from.
 *
 * Read leniently, like the categories: this is a form edited by hand, so a
 * half-filled entry gets defaults and a missing file means the site as it was
 * built (PAGINES_PER_DEFECTE, MENU_PER_DEFECTE). Pure, so the pages, the
 * sitemap filter in astro.config.mjs and the tests share it.
 */

/** The pages the code builds, each switchable. The key is also its path. */
export const PAGINES = [
  { clau: 'agenda', nom: 'Agenda' },
  { clau: 'castells', nom: 'Historial de castells' },
  { clau: 'galeria', nom: 'Galeria' },
  { clau: 'noticies', nom: 'Notícies' },
  { clau: 'la-colla', nom: 'La colla (Qui som)' },
  { clau: 'xorimusics', nom: 'Xorimúsics' },
  { clau: 'mallarengues', nom: 'Mallarengues' },
  { clau: 'junta-tecnica', nom: 'Junta tècnica' },
  { clau: 'junta-directiva', nom: 'Junta directiva' },
  { clau: 'documents', nom: 'Documents' },
  { clau: 'col-laboradors', nom: 'Col·laboradors' },
  { clau: 'merchandising', nom: 'Botiga' },
  { clau: 'uneix-te', nom: 'Uneix-te' },
] as const;
export type ClauPagina = (typeof PAGINES)[number]['clau'];
const CLAUS = new Set<string>(PAGINES.map((p) => p.clau));
export const esPagina = (clau: unknown): clau is ClauPagina => typeof clau === 'string' && CLAUS.has(clau);

/** Where an entry shows in the header. */
export const LLOCS = ['barra', 'colla', 'organitzacio', 'boto', 'cap'] as const;
export type Lloc = (typeof LLOCS)[number];
/** Which footer column it is listed in. */
export const COLUMNES = ['colla', 'castells', 'organitzacio', 'xarxes', 'cap'] as const;
export type Columna = (typeof COLUMNES)[number];

export interface EntradaMenu {
  nom: string;
  /** the footer's wording, when it says more than the bar («Historial de castells») */
  nomPeu?: string;
  /** 'inici', a page's key, a new page's address, or any other: a path on the site or a full URL */
  desti: string;
  lloc: Lloc;
  peu: Columna;
}

export interface Noms {
  desplegable: string;
  colla: string;
  organitzacio: string;
  peuColla: string;
  peuCastells: string;
  peuOrganitzacio: string;
  peuXarxes: string;
}

export const NOMS_PER_DEFECTE: Noms = {
  desplegable: 'La colla',
  colla: 'La colla',
  organitzacio: 'Organització',
  peuColla: 'La colla',
  peuCastells: 'Castells',
  peuOrganitzacio: 'Organització',
  peuXarxes: 'Segueix-nos',
};

/** The menus as the site was built before they were editable. */
export const MENU_PER_DEFECTE: EntradaMenu[] = [
  { nom: 'Agenda', desti: 'agenda', lloc: 'barra', peu: 'castells' },
  { nom: 'Historial', nomPeu: 'Historial de castells', desti: 'castells', lloc: 'barra', peu: 'castells' },
  { nom: 'Galeria', desti: 'galeria', lloc: 'barra', peu: 'castells' },
  { nom: 'Notícies', desti: 'noticies', lloc: 'barra', peu: 'castells' },
  { nom: 'Qui som', desti: 'la-colla', lloc: 'colla', peu: 'colla' },
  { nom: 'Xorimúsics', desti: 'xorimusics', lloc: 'colla', peu: 'colla' },
  { nom: 'Mallarengues', desti: 'mallarengues', lloc: 'colla', peu: 'colla' },
  { nom: 'Junta tècnica', desti: 'junta-tecnica', lloc: 'organitzacio', peu: 'organitzacio' },
  { nom: 'Junta directiva', desti: 'junta-directiva', lloc: 'organitzacio', peu: 'organitzacio' },
  { nom: 'Documents', desti: 'documents', lloc: 'organitzacio', peu: 'organitzacio' },
  { nom: 'Col·laboradors', desti: 'col-laboradors', lloc: 'organitzacio', peu: 'organitzacio' },
  { nom: 'Botiga', desti: 'merchandising', lloc: 'barra', peu: 'organitzacio' },
  { nom: 'Uneix-te', nomPeu: 'Uneix-te a la colla', desti: 'uneix-te', lloc: 'boto', peu: 'cap' },
  { nom: 'Contacta’ns', desti: 'col-laboradors#contacte', lloc: 'cap', peu: 'xarxes' },
];

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const entre = <T extends string>(llista: readonly T[], v: unknown, perDefecte: T): T =>
  (llista as readonly string[]).includes(v as string) ? (v as T) : perDefecte;

/**
 * Which pages are switched off: those ticked under «Pàgines apagades». The
 * form asks which to switch off, not which to keep, because the CMS shows a
 * checkbox it has no value for as unticked: a page added to the list later, or
 * a form opened before its file existed, must read as on, so that saving it
 * cannot switch the whole site off.
 */
export function paginesApagades(dades: unknown): Set<ClauPagina> {
  const d = (dades ?? {}) as { apagades?: unknown };
  const apagades = new Set<ClauPagina>();
  if (d.apagades && typeof d.apagades === 'object') {
    for (const [clau, valor] of Object.entries(d.apagades)) if (esPagina(clau) && valor === true) apagades.add(clau);
  }
  return apagades;
}

/**
 * The menu entries, in order. An entry needs a name and somewhere to go; one
 * without is skipped and reported. In the CMS a destination is a select
 * (`pagina`) with «Una altra adreça» for anything else (`adreca`).
 */
export function llegeixMenu(dades: unknown): { menu: EntradaMenu[]; avisos: string[] } {
  const d = (dades ?? {}) as { menu?: unknown };
  if (!Array.isArray(d.menu) || d.menu.length === 0) return { menu: MENU_PER_DEFECTE, avisos: [] };
  const avisos: string[] = [];
  const menu: EntradaMenu[] = [];
  for (const e of d.menu) {
    const nom = text(e?.nom);
    // «On porta» is a select: a page, «Una pàgina nova» (then `paginaNova`, the
    // address of one of Pàgines noves) or «Una altra adreça» (then `adreca`)
    const pagina = text(e?.pagina);
    const desti = pagina === 'nova' ? text(e?.paginaNova) : pagina && pagina !== 'adreca' ? pagina : text(e?.adreca);
    if (!nom || !desti) {
      avisos.push(`una entrada del menú sense ${nom ? 'destinació' : 'nom'}`);
      continue;
    }
    menu.push({
      nom,
      nomPeu: text(e?.nomPeu) || undefined,
      desti,
      lloc: entre(LLOCS, e?.lloc, 'barra'),
      peu: entre(COLUMNES, e?.peu, 'cap'),
    });
  }
  return { menu, avisos };
}

export function llegeixNoms(dades: unknown): Noms {
  const noms = ((dades ?? {}) as { noms?: Record<string, unknown> }).noms ?? {};
  const resultat = { ...NOMS_PER_DEFECTE };
  for (const clau of Object.keys(resultat) as (keyof Noms)[]) resultat[clau] = text(noms[clau]) || resultat[clau];
  return resultat;
}

export interface Enllac {
  text: string;
  href: string;
  /** opens in a new tab: an address outside the site */
  extern: boolean;
}

/**
 * Resolves the structure into what the layout draws. `buides` are pages that
 * are on but have nothing to show yet (Notícies with every item a draft), and
 * new pages still in draft: no menu or link points at them.
 */
export function resolEstructura(dades: unknown, { base, buides = new Set<string>() }: { base: string; buides?: Set<string> }) {
  const apagades = paginesApagades(dades);
  const { menu, avisos } = llegeixMenu(dades);
  const noms = llegeixNoms(dades);

  const activa = (clau: ClauPagina) => !apagades.has(clau);
  /** The address of a page, or undefined when nothing should link to it. */
  const enllac = (clau: ClauPagina): string | undefined =>
    activa(clau) && !buides.has(clau) ? `${base}${clau}` : undefined;

  /** Where an entry goes, or undefined when its page is off or empty. */
  const adreca = (desti: string): { href: string; extern: boolean } | undefined => {
    if (desti === 'inici') return { href: base, extern: false };
    if (/^(https?:|mailto:|tel:)/i.test(desti)) return { href: desti, extern: /^https?:/i.test(desti) };
    const cami = desti.replace(/^\/+/, '');
    const primer = cami.split(/[/#?]/)[0];
    if ((esPagina(primer) && !enllac(primer)) || buides.has(primer)) return undefined;
    return { href: `${base}${cami}`, extern: false };
  };

  const resol = (e: EntradaMenu, peu = false): Enllac | undefined => {
    const a = adreca(e.desti);
    return a && { text: peu ? e.nomPeu ?? e.nom : e.nom, ...a };
  };

  // the bar: its links in order, with the dropdown where its first entry is
  type Peca = { tipus: 'enllac'; enllac: Enllac } | { tipus: 'desplegable' };
  const barra: Peca[] = [];
  const colla: Enllac[] = [];
  const organitzacio: Enllac[] = [];
  let boto: { barra: Enllac; peu: Enllac } | undefined;
  for (const e of menu) {
    const enl = resol(e);
    if (!enl) continue;
    if (e.lloc === 'boto' && !boto) boto = { barra: enl, peu: resol(e, true)! };
    else if (e.lloc === 'barra' || e.lloc === 'boto') barra.push({ tipus: 'enllac', enllac: enl });
    else if (e.lloc === 'colla' || e.lloc === 'organitzacio') {
      if (!colla.length && !organitzacio.length) barra.push({ tipus: 'desplegable' });
      (e.lloc === 'colla' ? colla : organitzacio).push(enl);
    }
  }

  const columna = (c: Columna) => menu.filter((e) => e.peu === c).map((e) => resol(e, true)).filter((x): x is Enllac => !!x);
  const peu = {
    colla: columna('colla'),
    castells: columna('castells'),
    organitzacio: columna('organitzacio'),
    xarxes: columna('xarxes'),
  };

  return { activa, enllac, adreca, barra, colla, organitzacio, boto, peu, noms, avisos };
}
export type Estructura = ReturnType<typeof resolEstructura>;
