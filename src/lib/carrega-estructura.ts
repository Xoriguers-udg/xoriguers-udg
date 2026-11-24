/**
 * The site's structure (src/lib/estructura.ts) as the pages read it at build
 * time, from Configuració → Estructura del web.
 */
import { getCollection, getEntry } from 'astro:content';
import { resolEstructura, type ClauPagina } from './estructura';
import { paginaRedireccio } from './redireccio';

export async function carregaEstructura() {
  const dades = (await getEntry('configuracio', 'estructura'))?.data;
  // Notícies is on, but nothing points at it while every item is a draft;
  // nor at a new page still in draft
  const hiHaNoticies = (await getCollection('noticies', ({ data }) => data.estat === 'publicat')).length > 0;
  const esborranys = (await getCollection('paginesNoves', ({ data }) => data.estat !== 'publicat')).map((p) => p.id);
  return resolEstructura(dades, {
    base: import.meta.env.BASE_URL,
    buides: new Set([...(hiHaNoticies ? [] : ['noticies']), ...esborranys]),
  });
}

/** Whether a page is switched on, for the routes that build many pages. */
export async function paginaActiva(clau: ClauPagina) {
  return (await carregaEstructura()).activa(clau);
}

/**
 * For a page that can be switched off: what to answer at its address while it
 * is. Not a 404 but a quiet redirect to the homepage, so an old link or a
 * bookmark still lands somewhere; noindex, and left out of the sitemap.
 */
export async function siApagada(clau: ClauPagina, site: URL | undefined): Promise<Response | undefined> {
  if (await paginaActiva(clau)) return undefined;
  const inici = import.meta.env.BASE_URL;
  return new Response(paginaRedireccio(inici, new URL(inici, site).href), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
