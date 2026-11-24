/**
 * The colla's social networks: a list of name and address in Configuració →
 * General, so a new one (TikTok, Bluesky…) is one more row rather than a code
 * change. The footer lists them in their order; the homepage's Instagram band
 * and Col·laboradors find Instagram among them by its address.
 */
import { isRealUrl } from './config.ts';

export interface Xarxa {
  nom: string;
  url: string;
}

interface Dades {
  xarxes?: unknown;
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
}

/**
 * The networks to show, skipping a row with no name or no real address. A
 * file from before the list (four fixed fields) still reads, in the order the
 * footer used to show them.
 */
export function llegeixXarxes(dades: Dades | null | undefined): Xarxa[] {
  if (Array.isArray(dades?.xarxes)) {
    return dades.xarxes
      .map((x) => ({ nom: String(x?.nom ?? '').trim(), url: String(x?.url ?? '').trim() }))
      .filter((x) => x.nom && isRealUrl(x.url));
  }
  return (
    [
      ['Instagram', dades?.instagramUrl],
      ['Facebook', dades?.facebookUrl],
      ['Twitter', dades?.twitterUrl],
      ['YouTube', dades?.youtubeUrl],
    ] as const
  )
    .filter(([, url]) => isRealUrl(url))
    .map(([nom, url]) => ({ nom, url: url! }));
}

/** The Instagram address among the networks, if there is one. */
export const instagramDe = (xarxes: Xarxa[]) => xarxes.find((x) => /instagram\.com/i.test(x.url))?.url;
