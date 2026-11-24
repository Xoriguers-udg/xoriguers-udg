/**
 * The homepage's sections, as the colla orders, titles and switches them in
 * the CMS (Pàgines → Inici → Seccions de la portada): a list, dragged into
 * order, each row a section, an «Amaga-la» checkbox and an optional heading.
 * The checkbox hides rather than shows because the CMS shows a box it has no
 * value for as unticked, which must not mean hidden.
 *
 * Read leniently: a section named twice counts once, an unknown one is
 * skipped, and with no list at all the page is what it was before.
 */

/**
 * `nom` is what the CMS stores and shows on each collapsed row of the list,
 * so it is the readable one; `clau` is the code's. Either is read.
 */
export const SECCIONS_PORTADA = [
  { clau: 'presentacio', nom: 'Qui som', titol: 'Qui som' },
  { clau: 'properes', nom: 'Pròximes actuacions', titol: 'Pròximes actuacions' },
  { clau: 'ultimsCastells', nom: 'Últims castells', titol: 'Últims castells' },
  { clau: 'activitats', nom: 'Activitats', titol: 'No només fem castells' },
  // these two are titled by what they show: Uneix-te's own title, the album's name
  { clau: 'uneix', nom: 'Uneix-te', titol: undefined },
  { clau: 'noticies', nom: 'Notícies', titol: 'Notícies' },
  { clau: 'album', nom: 'Últim àlbum', titol: undefined },
  { clau: 'instagram', nom: 'Instagram', titol: 'Segueix-nos a Instagram' },
] as const;
export type ClauSeccio = (typeof SECCIONS_PORTADA)[number]['clau'];
const PER_CLAU = new Map(SECCIONS_PORTADA.map((s) => [s.clau as string, s]));
const normalitza = (v: unknown) => String(v ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
const PER_NOM = new Map(SECCIONS_PORTADA.flatMap((s) => [[normalitza(s.clau), s.clau], [normalitza(s.nom), s.clau]]));
/** A row's section, by its name or its key. */
const clauDe = (v: unknown): ClauSeccio | undefined => PER_NOM.get(normalitza(v));

export interface Seccio {
  clau: ClauSeccio;
  /** the heading to use; undefined where the section takes its own */
  titol?: string;
}

/**
 * The sections to show, in order. `antics` are the two headings the form had
 * before the list (presentacioTitol, properesTitol), still honoured when a
 * row leaves its heading empty.
 */
export function llegeixSeccions(seccions: unknown, antics: { presentacioTitol?: string; properesTitol?: string } = {}): Seccio[] {
  const titolDe = (clau: ClauSeccio, propi?: unknown) =>
    (typeof propi === 'string' && propi.trim()) ||
    (clau === 'presentacio' && antics.presentacioTitol) ||
    (clau === 'properes' && antics.properesTitol) ||
    PER_CLAU.get(clau)!.titol;

  // the first form: an object of checkboxes, in the page's fixed order
  if (!Array.isArray(seccions)) {
    const marques = (seccions && typeof seccions === 'object' ? seccions : {}) as Record<string, unknown>;
    return SECCIONS_PORTADA.filter((s) => marques[s.clau] !== false).map((s) => ({ clau: s.clau, titol: titolDe(s.clau) }));
  }

  const vistes = new Set<string>();
  const resultat: Seccio[] = [];
  for (const fila of seccions) {
    const clau = clauDe(fila?.seccio);
    if (!clau || vistes.has(clau)) continue;
    vistes.add(clau);
    // «Amaga-la» ticked; `mostra: false` is how the first version of the list said it
    if (fila?.amaga === true || fila?.mostra === false) continue;
    resultat.push({ clau, titol: titolDe(clau, fila?.titol) });
  }
  return resultat;
}

/**
 * The sections as the page lays them out. Qui som and Pròximes actuacions,
 * when they come one right after the other, share a row (the presentation on
 * the left, what is next on the right); apart, each takes a row of its own.
 */
export type Bloc =
  | { tipus: 'qui-som'; presentacio?: Seccio; properes?: Seccio }
  | { tipus: 'seccio'; seccio: Seccio };

export function blocsDe(seccions: Seccio[]): Bloc[] {
  const blocs: Bloc[] = [];
  for (let i = 0; i < seccions.length; i++) {
    const s = seccions[i];
    if (s.clau !== 'presentacio' && s.clau !== 'properes') {
      blocs.push({ tipus: 'seccio', seccio: s });
      continue;
    }
    const seguent = seccions[i + 1];
    const parella = seguent && (seguent.clau === 'presentacio' || seguent.clau === 'properes') && seguent.clau !== s.clau;
    const membres = parella ? [s, seguent] : [s];
    blocs.push({
      tipus: 'qui-som',
      presentacio: membres.find((m) => m.clau === 'presentacio'),
      properes: membres.find((m) => m.clau === 'properes'),
    });
    if (parella) i++;
  }
  return blocs;
}
