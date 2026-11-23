import { describe, expect, it } from 'vitest';
import { classificaEsdeveniment, detallsEsdeveniment, llegeixParaules, llocComplet, separaLloc, temporadaDe, type ReglaTipus } from './esdeveniment';

describe('classificaEsdeveniment', () => {
  it('reads the calendar\'s own naming', () => {
    expect(classificaEsdeveniment('ASSAIG')).toBe('Assaig');
    expect(classificaEsdeveniment('ACTUACIÓ RESA')).toBe('Actuacio');
  });

  it('reads the registre històric\'s naming', () => {
    expect(classificaEsdeveniment('Diada hivern Xoriguers')).toBe('Diada');
    expect(classificaEsdeveniment('Actuació viatge Logroño')).toBe('Actuacio');
    expect(classificaEsdeveniment('Trobada Interiuta')).toBe('Trobada');
  });

  it('never files a practice as a performance', () => {
    expect(classificaEsdeveniment('Assaig obert de primavera')).toBe('Assaig');
    expect(classificaEsdeveniment("Assajos d'estiu")).toBe('Assaig');
  });

  it('falls back to an actuació for names that say nothing', () => {
    expect(classificaEsdeveniment('Aniverfest')).toBe('Actuacio');
    expect(classificaEsdeveniment("Colles de l'eix")).toBe('Actuacio');
  });
  it('ignores case and accents, and lets a word run on', () => {
    expect(classificaEsdeveniment('ACTUACIONS DE FESTA MAJOR')).toBe('Actuacio');
    expect(classificaEsdeveniment('actuacio embos')).toBe('Actuacio');
  });
});

describe('classificaEsdeveniment with the colla\'s own words', () => {
  const regles: ReglaTipus[] = [
    { tipus: 'Assaig', paraules: ['assaig', 'xorifit', 'xorimúsics'] },
    { tipus: 'Diada', paraules: ['diada', 'aniversari'] },
    { tipus: 'Altres', paraules: ['sopar', 'calçotada', 'festa major de la UdG'] },
    { tipus: 'Actuacio', paraules: ['actuació', 'cercavila'] },
  ];

  it('takes any of several words for one type', () => {
    expect(classificaEsdeveniment('ASSAIG XORIFIT', regles)).toBe('Assaig');
    expect(classificaEsdeveniment('ASSAIG XORIMÚSICS', regles)).toBe('Assaig');
    expect(classificaEsdeveniment('Xorimusics a la plaça', regles)).toBe('Assaig');
    expect(classificaEsdeveniment('Aniversari Emboirats', regles)).toBe('Diada');
    expect(classificaEsdeveniment('CALÇOTADA', regles)).toBe('Altres');
    expect(classificaEsdeveniment('Cercavila de Fires', regles)).toBe('Actuacio');
  });

  it('matches a phrase of several words', () => {
    expect(classificaEsdeveniment('Festa Major de la UdG 2027', regles)).toBe('Altres');
    expect(classificaEsdeveniment('Festa major de Salt', regles)).toBe('Actuacio');
  });

  it('follows the order of the rules when a name has words of two', () => {
    expect(classificaEsdeveniment('Sopar de la diada', regles)).toBe('Diada');
  });

  it('only matches where a word starts', () => {
    expect(classificaEsdeveniment('Cafira', [{ tipus: 'Altres', paraules: ['fira'] }])).toBe('Actuacio');
    expect(classificaEsdeveniment('Fira de Girona', [{ tipus: 'Altres', paraules: ['fira'] }])).toBe('Altres');
  });

  it('uses the chosen fallback, and skips empty words', () => {
    expect(classificaEsdeveniment('Aniverfest', regles, 'Altres')).toBe('Altres');
    expect(classificaEsdeveniment('Aniverfest', [{ tipus: 'Assaig', paraules: ['', '  '] }])).toBe('Actuacio');
  });
});

describe('temporadaDe', () => {
  const at = (iso: string) => temporadaDe(new Date(iso));

  it('starts a season in September', () => {
    expect(at('2025-09-25')).toBe('2025-2026');
    expect(at('2025-08-31')).toBe('2024-2025');
  });

  it('keeps the spring on the season that began the autumn before', () => {
    expect(at('2026-05-28')).toBe('2025-2026');
    expect(at('2023-06-17')).toBe('2022-2023');
  });
});

describe('llocComplet', () => {
  it('joins the venue and the town', () => {
    expect(llocComplet('Plaça del Vi', 'Girona')).toBe('Plaça del Vi, Girona');
  });

  it('keeps whichever half it has', () => {
    expect(llocComplet('Plaça del Vi', undefined)).toBe('Plaça del Vi');
    expect(llocComplet(undefined, 'Girona')).toBe('Girona');
  });

  it('is undefined when neither is known', () => {
    expect(llocComplet(undefined, undefined)).toBeUndefined();
  });
});

describe('detallsEsdeveniment', () => {
  it('reads time then place', () => {
    expect(detallsEsdeveniment('12:00', 'Plaça del Vi', 'Girona')).toBe('12:00 · Plaça del Vi, Girona');
  });

  it('leaves no stray separators when parts are missing', () => {
    expect(detallsEsdeveniment('12:00', undefined, undefined)).toBe('12:00');
    expect(detallsEsdeveniment(undefined, undefined, 'Girona')).toBe('Girona');
    expect(detallsEsdeveniment(undefined, undefined, undefined)).toBe('');
  });
});

describe('separaLloc', () => {
  it('takes the town from a Google Maps address and drops the country', () => {
    expect(separaLloc('Carrer de les Hortes, 17001 Girona, Espanya')).toEqual({ lloc: 'Carrer de les Hortes', poblacio: 'Girona' });
    expect(separaLloc('Església de Sant Domènec, Pujada de Sant Domènec, 17004 Girona, Spain')).toEqual({
      lloc: 'Església de Sant Domènec, Pujada de Sant Domènec',
      poblacio: 'Girona',
    });
  });

  it('keeps a town of more than one word', () => {
    expect(separaLloc("Plaça Major, 17190 Salt, Espanya")).toEqual({ lloc: 'Plaça Major', poblacio: 'Salt' });
    expect(separaLloc("Plaça de la Vila, 17820 Banyoles, Espanya").poblacio).toBe('Banyoles');
    expect(separaLloc("Rambla, 08001 Sant Feliu de Guíxols, Espanya").poblacio).toBe('Sant Feliu de Guíxols');
  });

  it('keeps a place typed by hand whole, with no town guessed', () => {
    expect(separaLloc('Pavelló UdG, Campus Montilivi')).toEqual({ lloc: 'Pavelló UdG, Campus Montilivi' });
    expect(separaLloc('Plaça del Vi')).toEqual({ lloc: 'Plaça del Vi' });
  });

  it('gives nothing for an empty location', () => {
    expect(separaLloc(undefined)).toEqual({});
    expect(separaLloc('  ')).toEqual({});
  });
});

describe('llegeixParaules', () => {
  it('splits the CMS\'s one line on commas, whatever the spacing', () => {
    expect(llegeixParaules('assaig, assajos,xorifit ,  xorimúsics')).toEqual(['assaig', 'assajos', 'xorifit', 'xorimúsics']);
  });

  it('keeps a phrase of several words whole', () => {
    expect(llegeixParaules('festa major, sopar de gala')).toEqual(['festa major', 'sopar de gala']);
  });

  it('accepts a list, and drops empty words', () => {
    expect(llegeixParaules(['assaig', ' ', 'assajos'])).toEqual(['assaig', 'assajos']);
    expect(llegeixParaules('assaig,, ,')).toEqual(['assaig']);
    expect(llegeixParaules(undefined)).toEqual([]);
  });
});
