/**
 * The categories of agenda entries (Actuació, Diada, Assaig…), as the colla
 * defines them in the CMS: Configuració → Calendari, stored in
 * src/content/configuracio/calendari.md. Each one says how it is named and
 * coloured on the site, whether it is listed as upcoming, whether it belongs to
 * the historial, and which words in a calendar event's name mean it.
 *
 * An agenda entry stores a category's `clau`, never its name, so renaming a
 * category does not orphan the entries that have it.
 *
 * Read by the pages at build time and by the calendar importer, both through
 * llegeixCategories, which is lenient on purpose: this is edited by hand in a
 * form, and a half-filled category must not fail the build or stop the sync.
 */
// with its extension: the calendar importer runs this file directly in Node
import { classificaEsdeveniment, llegeixParaules, type ReglaTipus } from './esdeveniment.ts';

export const COLORS = ['blau', 'groc', 'verd', 'gris'] as const;
export type Color = (typeof COLORS)[number];

/** Whether past entries of a category belong to the historial of castells. */
export const HISTORIAL = ['sempre', 'ambCastells', 'mai'] as const;
export type Historial = (typeof HISTORIAL)[number];

export interface Categoria {
  clau: string;
  nom: string;
  paraules: string[];
  color: Color;
  /** listed under «Pròximes actuacions» and in the agenda while upcoming */
  agenda: boolean;
  historial: Historial;
}

/** The pill class each colour maps to (global.css). */
export const CLASSE_PILL: Record<Color, string> = {
  blau: 'pill-blue',
  groc: 'pill-gold',
  verd: 'pill-moss',
  gris: 'pill-neutral',
};

/**
 * What the site did before the categories were editable, and what it falls
 * back to if the CMS file is missing or empty. Assaig goes first so a practice
 * is never filed as a performance.
 */
export const CATEGORIES_PER_DEFECTE: Categoria[] = [
  { clau: 'Assaig', nom: 'Assaig', paraules: ['assaig', 'assajos'], color: 'gris', agenda: true, historial: 'ambCastells' },
  { clau: 'Diada', nom: 'Diada', paraules: ['diada'], color: 'blau', agenda: true, historial: 'sempre' },
  { clau: 'Trobada', nom: 'Trobada', paraules: ['trobada'], color: 'blau', agenda: true, historial: 'sempre' },
  { clau: 'Actuacio', nom: 'Actuació', paraules: ['actuació'], color: 'blau', agenda: true, historial: 'sempre' },
  { clau: 'Altres', nom: 'Altres', paraules: [], color: 'blau', agenda: true, historial: 'sempre' },
];
export const PER_DEFECTE = 'Actuacio';

/** Keys compare without case, accents or surrounding spaces: «actuació» is «Actuacio». */
export const normalitzaClau = (clau: unknown) =>
  String(clau ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

export interface Classificacio {
  categories: Categoria[];
  /** the clau given to a calendar event whose name has none of the words */
  perDefecte: string;
  /** what was skipped, for the importer to report */
  avisos: string[];
}

/**
 * Reads the CMS data (the frontmatter of calendari.md, as an object). A
 * category with no name and no key is skipped; one with only a name gets the
 * name as its key; a missing colour or setting takes the usual default. With
 * no usable category at all, the built-in ones apply.
 */
export function llegeixCategories(dades: unknown): Classificacio {
  const d = (dades ?? {}) as { categories?: unknown; tipusPerDefecte?: unknown };
  const avisos: string[] = [];
  const categories: Categoria[] = [];
  const vistes = new Set<string>();

  for (const c of Array.isArray(d.categories) ? d.categories : []) {
    const nom = String(c?.nom ?? '').trim();
    const clau = String(c?.clau ?? '').trim() || nom;
    if (!clau) {
      avisos.push('una categoria sense nom ni identificador');
      continue;
    }
    if (vistes.has(normalitzaClau(clau))) {
      avisos.push(`l'identificador «${clau}» està repetit; es fa servir el primer`);
      continue;
    }
    vistes.add(normalitzaClau(clau));
    categories.push({
      clau,
      nom: nom || clau,
      paraules: llegeixParaules(c?.paraules),
      color: (COLORS as readonly string[]).includes(c?.color) ? c.color : 'blau',
      agenda: c?.agenda !== false,
      historial: (HISTORIAL as readonly string[]).includes(c?.historial) ? c.historial : 'sempre',
    });
  }

  const llista = categories.length ? categories : CATEGORIES_PER_DEFECTE;
  const demanat = normalitzaClau(d.tipusPerDefecte);
  const perDefecte =
    llista.find((c) => normalitzaClau(c.clau) === demanat)?.clau ??
    llista.find((c) => normalitzaClau(c.clau) === normalitzaClau(PER_DEFECTE))?.clau ??
    llista[0].clau;
  return { categories: llista, perDefecte, avisos };
}

/**
 * The category an entry belongs to. An entry whose category was deleted from
 * the CMS keeps showing, under its stored key, with the usual behaviour, rather
 * than disappearing from the site.
 */
export function categoriaDe(clau: string, categories: Categoria[]): Categoria {
  const trobada = categories.find((c) => normalitzaClau(c.clau) === normalitzaClau(clau));
  return trobada ?? { clau, nom: clau, paraules: [], color: 'blau', agenda: true, historial: 'sempre' };
}

/** Whether a past entry appears in the historial (and its castells count). */
export function alHistorial(categoria: Categoria, nombreCastells: number): boolean {
  if (categoria.historial === 'mai') return false;
  if (categoria.historial === 'ambCastells') return nombreCastells > 0;
  return true;
}

/** The categories as classification rules, in their order. */
export const reglesDe = (categories: Categoria[]): ReglaTipus[] =>
  categories.map((c) => ({ tipus: c.clau, paraules: c.paraules }));

/**
 * The category a calendar event should have on this run of the sync.
 *
 * The sync files each event by the words of the categories, and it keeps doing
 * so: change the words in the CMS and the events already imported move too
 * (OCTOBERFEST was an Actuació until «October» became a word of Event). It
 * notes what it gave in `tipusCalendari`. An entry whose category no longer
 * matches that note was changed by hand in the CMS, and that choice stands.
 * An entry from before the note existed was filed by the sync, so it follows
 * the words.
 *
 * Returns the two fields to write, or null to leave the entry as it is.
 */
export function tipusSincronitzat(
  nom: string,
  actual: { tipus?: string | null; tipusCalendari?: string | null },
  classificacio: Pick<Classificacio, 'categories' | 'perDefecte'>
): { tipus: string; tipusCalendari: string } | null {
  const triatAMa =
    !!actual.tipusCalendari && normalitzaClau(actual.tipus) !== normalitzaClau(actual.tipusCalendari);
  if (triatAMa) return null;
  const tipus = classificaEsdeveniment(nom, reglesDe(classificacio.categories), classificacio.perDefecte);
  return { tipus, tipusCalendari: tipus };
}
