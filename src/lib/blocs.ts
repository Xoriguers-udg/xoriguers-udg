/**
 * The blocks a new page is built from (Pàgines noves in the CMS): a list the
 * colla fills in, one block at a time, each of one of a few kinds. Few on
 * purpose: every kind is drawn in the site's own style, so a page made from
 * them looks like the rest of the site, and the form stays short.
 *
 * Read leniently: a block of a kind this code does not know, or missing what
 * it needs (a photo block with no photo), is skipped, never a failed build.
 * The text of a block is Markdown; the loader (src/lib/carrega-blocs.ts)
 * renders it to `html` at build time.
 */

export const TIPUS_BLOCS = ['text', 'foto', 'fotoText', 'boto', 'mapa', 'album', 'documents'] as const;
export type TipusBloc = (typeof TIPUS_BLOCS)[number];

export const CATEGORIES_DOCUMENTS = ['Estatuts', 'Reglament', 'Protocol', 'Altres'] as const;

export type Bloc =
  | { tipus: 'text'; html: string }
  | { tipus: 'foto'; imatge: string; peu?: string; ample: boolean }
  | { tipus: 'fotoText'; imatge: string; html: string; costat: 'esquerra' | 'dreta' }
  | { tipus: 'boto'; text: string; desti: string }
  | { tipus: 'mapa'; ubicacio: string; titol?: string }
  | { tipus: 'album'; album: string }
  | { tipus: 'documents'; categoria?: (typeof CATEGORIES_DOCUMENTS)[number]; titol?: string };

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** A block's destination, as the menu stores it: a page key, or another address. */
const destiDe = (b: Record<string, unknown>) => {
  const pagina = text(b.pagina);
  return pagina && pagina !== 'adreca' ? pagina : text(b.adreca);
};

export function llegeixBlocs(blocs: unknown): Bloc[] {
  if (!Array.isArray(blocs)) return [];
  const resultat: Bloc[] = [];
  for (const cru of blocs) {
    if (!cru || typeof cru !== 'object') continue;
    const b = cru as Record<string, unknown>;
    // the CMS stores the kind as `type`; `html` is the loader's rendering of `text`
    const html = text(b.html);
    switch (b.type) {
      case 'text':
        if (html) resultat.push({ tipus: 'text', html });
        break;
      case 'foto':
        if (text(b.imatge)) resultat.push({ tipus: 'foto', imatge: text(b.imatge), peu: text(b.peu) || undefined, ample: b.ample === true });
        break;
      case 'fotoText':
        if (text(b.imatge) && html)
          resultat.push({ tipus: 'fotoText', imatge: text(b.imatge), html, costat: b.costat === 'dreta' ? 'dreta' : 'esquerra' });
        break;
      case 'boto':
        if (text(b.text) && destiDe(b)) resultat.push({ tipus: 'boto', text: text(b.text), desti: destiDe(b) });
        break;
      case 'mapa':
        if (text(b.ubicacio)) resultat.push({ tipus: 'mapa', ubicacio: text(b.ubicacio), titol: text(b.titol) || undefined });
        break;
      case 'album':
        if (text(b.album)) resultat.push({ tipus: 'album', album: text(b.album) });
        break;
      case 'documents': {
        const categoria = (CATEGORIES_DOCUMENTS as readonly string[]).includes(b.categoria as string)
          ? (b.categoria as (typeof CATEGORIES_DOCUMENTS)[number])
          : undefined;
        resultat.push({ tipus: 'documents', categoria, titol: text(b.titol) || undefined });
        break;
      }
    }
  }
  return resultat;
}

/**
 * Addresses a new page cannot take, because the site already answers there.
 * A page whose address is one of these is not built (and the CMS says so).
 */
export const ADRECES_RESERVADES = new Set([
  'agenda', 'castells', 'galeria', 'noticies', 'la-colla', 'xorimusics', 'mallarengues',
  'junta-tecnica', 'junta-directiva', 'documents', 'col-laboradors', 'merchandising', 'uneix-te',
  'admin', 'arbre', 'images', 'inici', '404', '_astro',
]);
