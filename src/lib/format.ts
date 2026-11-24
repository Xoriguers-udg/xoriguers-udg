export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

export function formatDateShort(d: Date): string {
  return new Intl.DateTimeFormat('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function formatDayMonth(d: Date): string {
  return new Intl.DateTimeFormat('ca-ES', { day: 'numeric', month: 'short' }).format(d).toUpperCase();
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
