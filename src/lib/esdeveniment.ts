export const TIPUS = ['Actuacio', 'Assaig', 'Diada', 'Trobada', 'Altres'] as const;
export type TipusEsdeveniment = (typeof TIPUS)[number];

/** One type and the words in an event's name that mean it. */
export interface ReglaTipus {
  tipus: TipusEsdeveniment;
  paraules: string[];
}

/**
 * The calendar names events by their kind ("ASSAIG", "ACTUACIÓ RESA") and the
 * registre històric follows the same habit ("Diada hivern Xoriguers"), so the
 * name is enough to classify. The colla edits these words in the CMS
 * (Configuració → Calendari, src/content/configuracio/calendari.md); these are
 * the ones used when that file has none. Assaig goes first: it is the one kind
 * that is not a performance, and getting it wrong would put practices in the
 * archive.
 */
export const REGLES_PER_DEFECTE: ReglaTipus[] = [
  { tipus: 'Assaig', paraules: ['assaig', 'assajos'] },
  { tipus: 'Diada', paraules: ['diada'] },
  { tipus: 'Trobada', paraules: ['trobada'] },
  { tipus: 'Actuacio', paraules: ['actuació'] },
];

/**
 * The words as the CMS stores them: one line, separated by commas («assaig,
 * assajos, xorifit»). A list is accepted too. Decap's own comma-separated list
 * field is not used because it eats a comma typed before a space, so «assajos,
 * xorifit» was saved as «assajosxorifit».
 */
export function llegeixParaules(valor: unknown): string[] {
  const parts = Array.isArray(valor) ? valor.map(String) : typeof valor === 'string' ? valor.split(',') : [];
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** Lower case, no accents: «ACTUACIÓ» and «actuacio» are the same word. */
const normalitza = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
const escapa = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Whether the name has the word, ignoring case and accents. The word has to
 * start where a word of the name starts, and may run on: «actuació» finds
 * «ACTUACIONS», «assaig» finds «Assaig obert», but «fira» does not find
 * «Cafira». A phrase of several words works the same way.
 */
function conte(nom: string, paraula: string): boolean {
  const p = normalitza(paraula);
  if (!p) return false;
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapa(p)}`, 'u').test(normalitza(nom));
}

/**
 * The type of the first rule with a word in the name, in the rules' order, so
 * the order in the CMS is the priority. A name with none of the words gets
 * `perDefecte`.
 */
export function classificaEsdeveniment(
  nom: string,
  regles: ReglaTipus[] = REGLES_PER_DEFECTE,
  perDefecte: TipusEsdeveniment = 'Actuacio',
): TipusEsdeveniment {
  for (const regla of regles) {
    if (regla.paraules.some((paraula) => conte(nom, paraula))) return regla.tipus;
  }
  return perDefecte;
}

/**
 * Seasons run with the university year: September starts a new one, so
 * 25 September 2025 and 28 May 2026 are both "2025-2026".
 */
export function temporadaDe(data: Date): string {
  const any = data.getUTCFullYear();
  const mes = data.getUTCMonth() + 1;
  return mes >= 9 ? `${any}-${any + 1}` : `${any - 1}-${any}`;
}

/**
 * A place picked from Google Maps reaches the calendar as one line: «Església
 * de Sant Domènec, Pujada de Sant Domènec, 17004 Girona, Espanya». The site
 * keeps the place and the town apart, so the town is taken from the part with
 * the postcode and the country is dropped. A place typed by hand, with no
 * postcode, is kept whole as the lloc: there is no telling its town apart.
 */
export function separaLloc(location?: string): { lloc?: string; poblacio?: string } {
  if (!location?.trim()) return {};
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1 && /^(espanya|españa|spain|catalunya|catalonia)$/i.test(parts[parts.length - 1])) parts.pop();
  const ambCodi = parts.length > 1 ? parts[parts.length - 1].match(/^\d{5}\s+(.+)$/) : null;
  if (!ambCodi) return { lloc: parts.join(', ') };
  return { lloc: parts.slice(0, -1).join(', '), poblacio: ambCodi[1] };
}

/** "Plaça del Vi, Girona", or whichever half is known. */
export function llocComplet(lloc?: string, poblacio?: string): string | undefined {
  return [lloc, poblacio].filter(Boolean).join(', ') || undefined;
}

/** The one-line "12:00 · Plaça del Vi, Girona" shown under an event's name. */
export function detallsEsdeveniment(hora?: string, lloc?: string, poblacio?: string): string {
  return [hora, llocComplet(lloc, poblacio)].filter(Boolean).join(' · ');
}
