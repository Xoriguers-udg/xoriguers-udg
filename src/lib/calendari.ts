/**
 * Everything derived from the one Google Calendar URL kept in Configuració:
 * the ICS feed the importer reads, and the embed the agenda page shows.
 */

const ZONA = 'Europe/Madrid';

/**
 * Display settings for the embed. Google's own chrome — title, tab switcher,
 * calendar list, timezone line — eats the height the month grid needs, which is
 * what makes the events look cramped, so all of it goes. Navigation and the
 * month label stay, or you cannot move between months.
 */
const VISTA_MENSUAL: Record<string, string> = {
  mode: 'MONTH',
  hl: 'ca',
  wkst: '2', // weeks start on Monday here, not Sunday
  showTitle: '0',
  showPrint: '0',
  showTabs: '0',
  showCalendars: '0',
  showTz: '0',
  showNav: '1',
  showDate: '1',
  bgcolor: '#ffffff',
};

function parse(embedUrl?: string): URL | undefined {
  if (!embedUrl) return undefined;
  try {
    const url = new URL(embedUrl.trim());
    return url.searchParams.has('src') ? url : undefined;
  } catch {
    // a placeholder like "[URL DEL CALENDARI]" rather than a real address
    return undefined;
  }
}

/** The calendar's address, e.g. abc123@group.calendar.google.com. */
export function idCalendari(embedUrl?: string): string | undefined {
  return parse(embedUrl)?.searchParams.get('src') ?? undefined;
}

/** The public ICS feed, which needs no credentials. */
export function urlFeedIcal(embedUrl?: string): string | undefined {
  const id = idCalendari(embedUrl);
  return id
    ? `https://calendar.google.com/calendar/ical/${encodeURIComponent(id)}/public/basic.ics`
    : undefined;
}

/**
 * Subscribing, so the colla's actuacions turn up in a visitor's own calendar
 * and stay up to date there. Google Calendar adds a public calendar from its
 * address; Apple Calendar, Outlook and the rest open the feed from a webcal:
 * link, which the device hands to its calendar app.
 */
export function urlSubscripcioGoogle(embedUrl?: string): string | undefined {
  const id = idCalendari(embedUrl);
  return id ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(id)}` : undefined;
}

export function urlSubscripcioWebcal(embedUrl?: string): string | undefined {
  return urlFeedIcal(embedUrl)?.replace(/^https:/, 'webcal:');
}

/**
 * The same calendar as a month grid with Google's furniture stripped off,
 * whatever display options happened to be in the pasted URL.
 */
export function urlEmbedMensual(embedUrl?: string): string | undefined {
  const url = parse(embedUrl);
  if (!url) return undefined;
  if (!url.searchParams.get('ctz')) url.searchParams.set('ctz', ZONA);
  for (const [clau, valor] of Object.entries(VISTA_MENSUAL)) {
    url.searchParams.set(clau, valor);
  }
  return url.toString();
}
