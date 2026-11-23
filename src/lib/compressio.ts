/**
 * What to do with an uploaded image before it is served. Editors upload photos
 * straight from their phones (4000px, 5 MB and more); the deploy and the hourly
 * job shrink them so nobody has to resize anything by hand.
 *
 * The decision is kept apart from sharp so it can be tested without images.
 */

/**
 * The longest side an image is kept at. The widest slot on the site is the
 * full-width colla photo on La colla, which 2000px covers on any desktop and at
 * 2x on a phone.
 */
export const COSTAT_MAXIM = 2000;

/** Below this, an image that is already small enough is left alone: re-encoding
 * a JPEG that is already light gains little and costs a little quality each time. */
export const MIDA_BONA = 500 * 1024;

/**
 * Written into every image the script has processed, as the EXIF «Software»
 * tag. A compressed photo can still be over MIDA_BONA, and without the mark it
 * would be re-encoded, and lose a little more, on every run.
 */
export const MARCA = 'xoriguers-udg: comprimeix-imatges';

/** What sharp can rewrite in the same format, so the file keeps its name and
 * every path in the content stays valid. GIF, SVG and PDF are not touched. */
const FORMATS = new Set(['jpeg', 'png', 'webp']);

export interface Mesura {
  amplada: number;
  alcada: number;
  bytes: number;
  /** the format sharp reads from the file's content, not its extension */
  format: string;
  /** whether the file already carries MARCA */
  marcada?: boolean;
}

export interface Pla {
  redimensiona: boolean;
}

/** Returns what to do with an image, or null to leave it as it is. */
export function planifica(m: Mesura): Pla | null {
  if (!FORMATS.has(m.format) || m.marcada) return null;
  const redimensiona = Math.max(m.amplada, m.alcada) > COSTAT_MAXIM;
  if (!redimensiona && m.bytes <= MIDA_BONA) return null;
  return { redimensiona };
}
