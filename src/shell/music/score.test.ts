import { describe, expect, it } from 'vitest';
import { abcWarnings, applyChordLabels, isDegreeLabel, isRomanLabel, measuresPerLine, pianoTune } from './score';

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

describe('applyChordLabels', () => {
  const abc = '"^Do7M|I7M"[EGB]8 | "^Sol/Si|V⁶""_9"A8 | "^Libre"C8';

  it('garde le nom, le degré, ou les deux empilés', () => {
    expect(applyChordLabels(abc, 'names')).toBe('"^Do7M"[EGB]8 | "^Sol/Si""_9"A8 | "^Libre"C8');
    expect(applyChordLabels(abc, 'degrees')).toBe('"^I7M"[EGB]8 | "^V⁶""_9"A8 | "^Libre"C8');
    expect(applyChordLabels(abc, 'both')).toBe('"^Do7M""^I7M"[EGB]8 | "^Sol/Si""^V⁶""_9"A8 | "^Libre"C8');
  });

  it('ne confond pas un dièse après un guillemet avec une annotation', () => {
    const tricky = '"^La7|V7""_3"^c4 | "^Ré m7|ii7"f2';
    expect(applyChordLabels(tricky, 'degrees')).toBe('"^V7""_3"^c4 | "^ii7"f2');
  });
});

describe('isRomanLabel', () => {
  it('reconnaît les degrés romains et pas les noms d’accords', () => {
    for (const d of ['I7M', 'V⁶', 'ii7/IV', 'iv', 'IV/V', 'vi7']) expect(isRomanLabel(d)).toBe(true);
    for (const c of ['Do7M', 'Sol/Si', 'La m7', 'Mi m7', '7M']) expect(isRomanLabel(c)).toBe(false);
  });
});
