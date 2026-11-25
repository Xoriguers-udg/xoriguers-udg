/*
 * Every date the site keeps (an actuació's day, an album's, a document's) is
 * a calendar day, stored as midnight UTC. So they are all read back in UTC:
 * read in the build machine's own zone, a build from anywhere west of
 * Greenwich would show each one a day early.
 */

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('ca-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}

export function formatDateShort(d: Date): string {
  return new Intl.DateTimeFormat('ca-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d);
}

export function formatDayMonth(d: Date): string {
  return new Intl.DateTimeFormat('ca-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d).toUpperCase();
}

/**
 * 28/05/2026 — how the registre itself writes a date, and short enough for the
 * dense columns of the historial. Read in UTC so a date cannot slip a day
 * depending on where the site is built.
 */
export function formatDateNumeric(d: Date): string {
  return new Intl.DateTimeFormat('ca-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

/**
 * Dijous, Dissabte: the day of the week, as a line on its own (so capitalised).
 * Read in UTC, as the dates are stored, so it names the right day wherever the
 * site is built.
 */
export function formatDiaSetmana(d: Date): string {
  const dia = new Intl.DateTimeFormat('ca-ES', { weekday: 'long', timeZone: 'UTC' }).format(d);
  return dia.charAt(0).toUpperCase() + dia.slice(1);
}

/** The short month of the homepage's date cards: «nov.», «des.». */
export function formatMesCurt(d: Date): string {
  return new Intl.DateTimeFormat('ca-ES', { month: 'short', timeZone: 'UTC' }).format(d);
}

/**
 * Today in Girona, as YYYY-MM-DD, whatever the clock of the machine that
 * builds the site (GitHub's runs on UTC, an hour or two behind).
 */
export function diaAvui(ara: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ara);
}

/**
 * Today in Girona in the stored dates' own terms (midnight UTC), to compare
 * with them: an actuació dated today is >= this all day long, and only the
 * next day does it count as past.
 */
export function avuiUTC(ara: Date = new Date()): Date {
  return new Date(diaAvui(ara));
}
