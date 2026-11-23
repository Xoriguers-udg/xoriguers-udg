/**
 * Whether an agenda entry gets a page of its own.
 *
 * Most do not. An actuació from the calendar is a name, a date, a time and a
 * place; a diada from the registre is its castells and maybe a note. The
 * agenda and the historial rows already show all of that, so a page for it
 * would repeat the row. An entry earns a page once the colla gives it
 * something a row cannot hold: a photo of a castell, a poster, a text, the
 * colles that took part. Its row then becomes a link, on the next publish,
 * with nothing else to switch on.
 *
 * An entry without a page still answers at its old address (agenda/<id>),
 * which sends the visitor to its row: links shared before, and the CMS's
 * «Veure a la web», keep working.
 */

export interface DadesFitxa {
  body?: string;
  data: {
    cartell?: string | null;
    collesParticipants?: string[] | null;
    castells?: { foto?: string | null }[] | null;
  };
}

const omplert = (valor: unknown) => typeof valor === 'string' && valor.trim() !== '';

export function teFitxa({ body, data }: DadesFitxa): boolean {
  return (
    omplert(body) ||
    omplert(data.cartell) ||
    (data.collesParticipants ?? []).some(omplert) ||
    (data.castells ?? []).some((c) => omplert(c?.foto))
  );
}

/** The ids the rows carry, for links to land on them. */
export const ancoraHistorial = (id: string) => `d-${id}`;
export const ancoraAgenda = (id: string) => `e-${id}`;

/**
 * Where a link to a past diada goes: its page, or else its row in the
 * historial. For the links that name a diada (the best castells, the latest
 * castells on the home page), which always point at the historial's entries.
 */
export const enllacDiada = (base: string, entry: DadesFitxa & { id: string }) =>
  teFitxa(entry) ? `${base}agenda/${entry.id}` : `${base}castells#${ancoraHistorial(entry.id)}`;
