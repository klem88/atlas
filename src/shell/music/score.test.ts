import { describe, expect, it } from 'vitest';
import { abcWarnings, isDegreeLabel, measuresPerLine, pianoTune } from './score';

describe('pianoTune', () => {
  const abc = pianoTune({ rh: '"^Do"[EGc]8 |[K:D] [FAd]8 |]', lh: '[C,C]8 |[K:D] [D,D]8 |]' });

  it('assemble deux portées lisibles', () => {
    expect(abc).toContain('%%staves {RH LH}');
    expect(abcWarnings(abc)).toEqual([]);
  });

  it('redit la tonalité en tête de la main gauche', () => {
    expect(abc).toContain('[V:LH] [K:C clef=bass]');
  });

  it('signale une partition mal écrite', () => {
    expect(abcWarnings(pianoTune({ rh: '[EGc8 |]', lh: 'C,8 |]' })).length).toBeGreaterThan(0);
  });
});

describe('isDegreeLabel', () => {
  it('reconnaît les degrés et pas les noms d’accords', () => {
    for (const d of ['7M', '9', '♭3', '3', '♯11']) expect(isDegreeLabel(d)).toBe(true);
    for (const c of ['Do7M', 'Sol/Si', 'La m7', 'Ré9']) expect(isDegreeLabel(c)).toBe(false);
  });
});

describe('measuresPerLine', () => {
  it('passe de deux mesures sur téléphone à quatre sur grand écran', () => {
    expect(measuresPerLine(343)).toBe(2);
    expect(measuresPerLine(700)).toBe(3);
    expect(measuresPerLine(1000)).toBe(4);
  });
});
