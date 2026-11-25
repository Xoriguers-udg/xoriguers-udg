import { describe, it, expect } from 'vitest';
import { avuiUTC, diaAvui, formatDate, formatDateNumeric, formatDateShort, formatDayMonth, formatDiaSetmana, formatMesCurt } from './format';

describe('formatDate', () => {
  it('formats a date in long Catalan form', () => {
    expect(formatDate(new Date('2026-03-05'))).toBe('5 de març del 2026');
  });
});

describe('formatDateShort', () => {
  it('formats a date with an abbreviated month', () => {
    expect(formatDateShort(new Date('2026-09-05'))).toBe('5 de set. del 2026');
  });
});

describe('formatDayMonth', () => {
  it('formats a short upper-cased day/month for the hero card', () => {
    expect(formatDayMonth(new Date('2026-03-05'))).toBe('5 DE MARÇ');
  });
});

describe('formatDateNumeric', () => {
  it('writes a date the compact way the registre does', () => {
    expect(formatDateNumeric(new Date('2026-05-28'))).toBe('28/05/2026');
    expect(formatDateNumeric(new Date('1999-12-02'))).toBe('02/12/1999');
  });

  it('reads the date in UTC, so it cannot slip a day on another machine', () => {
    expect(formatDateNumeric(new Date('2026-01-01T00:00:00Z'))).toBe('01/01/2026');
  });
});

describe('formatDiaSetmana', () => {
  it('names the day of the week, capitalised', () => {
    expect(formatDiaSetmana(new Date('2026-11-26'))).toBe('Dijous');
    expect(formatDiaSetmana(new Date('2026-12-05'))).toBe('Dissabte');
  });
});

describe('dates read in UTC', () => {
  // a date as stored: midnight UTC, which west of Greenwich is still the day before
  const dia = new Date('2026-11-26T00:00:00Z');
  it('names the stored day whatever the machine', () => {
    expect(formatDate(dia)).toBe('26 de novembre del 2026');
    expect(formatDateShort(dia)).toBe('26 de nov. del 2026');
    expect(formatDayMonth(dia)).toBe('26 DE NOV.');
    expect(formatMesCurt(dia)).toBe('nov.');
  });
});

describe('diaAvui and avuiUTC', () => {
  it('is the day in Girona, not in UTC', () => {
    // 23:30 UTC on the 25th is already 00:30 on the 26th in Girona (CET, UTC+1)
    expect(diaAvui(new Date('2026-11-25T23:30:00Z'))).toBe('2026-11-26');
    // and in summer (CEST, UTC+2)
    expect(diaAvui(new Date('2026-06-30T22:15:00Z'))).toBe('2026-07-01');
    expect(diaAvui(new Date('2026-06-30T21:15:00Z'))).toBe('2026-06-30');
  });

  it('compares with a stored date: today is not yet past', () => {
    const avui = avuiUTC(new Date('2026-11-26T20:00:00Z'));
    expect(new Date('2026-11-26') >= avui).toBe(true);
    expect(new Date('2026-11-25') >= avui).toBe(false);
  });
});
