import { describe, expect, it } from 'vitest';
import { parseChord } from './chords';
import {
  degreeLabel,
  degreeOf,
  degreeToken,
  parseDegreeLabel,
  parseProgression,
  progressionLabel,
  rotations,
  tokenToDegree,
  tokensOf,
} from './degrees';

const c = (s: string) => parseChord(s)!;

describe('degré d’un accord dans une tonalité', () => {
  it('numérote depuis la tonique, en classe de triade', () => {
    expect(degreeOf(c('C'), 0)).toEqual({ step: 0, cls: 'maj' });
    expect(degreeOf(c('G7'), 0)).toEqual({ step: 7, cls: 'maj' });
    expect(degreeOf(c('Am7'), 0)).toEqual({ step: 9, cls: 'min' });
    expect(degreeOf(c('Bm7b5'), 0)).toEqual({ step: 11, cls: 'dim' });
    expect(degreeOf(c('Bb'), 0)).toEqual({ step: 10, cls: 'maj' });
    expect(degreeOf(c('D'), 7)).toEqual({ step: 7, cls: 'maj' });
    expect(degreeOf(c('C'), 7)).toEqual({ step: 5, cls: 'maj' });
  });
  it('étiquette en chiffres romains', () => {
    expect(degreeLabel({ step: 0, cls: 'maj' })).toBe('I');
    expect(degreeLabel({ step: 2, cls: 'min' })).toBe('ii');
    expect(degreeLabel({ step: 11, cls: 'dim' })).toBe('vii°');
    expect(degreeLabel({ step: 10, cls: 'maj' })).toBe('bVII');
    expect(degreeLabel({ step: 8, cls: 'maj' })).toBe('bVI');
    expect(degreeLabel({ step: 5, cls: 'min' })).toBe('iv');
    expect(degreeLabel({ step: 4, cls: 'maj' })).toBe('III');
    expect(degreeLabel({ step: 6, cls: 'dim' })).toBe('#iv°');
    expect(degreeLabel({ step: 0, cls: 'aug' })).toBe('I+');
    expect(degreeLabel({ step: 7, cls: 'sus' })).toBe('Vsus');
    expect(degreeLabel({ step: 7, cls: 'other' })).toBe('V?');
  });
  it('relit les étiquettes, avec ou sans septième, ° ou o', () => {
    expect(parseDegreeLabel('I')).toEqual({ step: 0, cls: 'maj' });
    expect(parseDegreeLabel('ii')).toEqual({ step: 2, cls: 'min' });
    expect(parseDegreeLabel('V7')).toEqual({ step: 7, cls: 'maj' });
    expect(parseDegreeLabel('vii°')).toEqual({ step: 11, cls: 'dim' });
    expect(parseDegreeLabel('viio')).toEqual({ step: 11, cls: 'dim' });
    expect(parseDegreeLabel('bVII')).toEqual({ step: 10, cls: 'maj' });
    expect(parseDegreeLabel('♭VI')).toEqual({ step: 8, cls: 'maj' });
    expect(parseDegreeLabel('#iv°')).toEqual({ step: 6, cls: 'dim' });
    expect(parseDegreeLabel('III+')).toEqual({ step: 4, cls: 'aug' });
    expect(parseDegreeLabel('Vsus')).toEqual({ step: 7, cls: 'sus' });
    expect(parseDegreeLabel('iv')).toEqual({ step: 5, cls: 'min' });
    expect(parseDegreeLabel('')).toBeNull();
    expect(parseDegreeLabel('VIII')).toBeNull();
    expect(parseDegreeLabel('x')).toBeNull();
  });
  it('code chaque degré sur un octet et revient', () => {
    for (let step = 0; step < 12; step++) {
      for (const cls of ['maj', 'min', 'dim', 'aug', 'sus', 'other'] as const) {
        const t = degreeToken({ step, cls });
        expect(t).toBeGreaterThanOrEqual(0);
        expect(t).toBeLessThan(72);
        expect(tokenToDegree(t)).toEqual({ step, cls });
      }
    }
  });
});

describe('suites de degrés', () => {
  it('retire les répétitions immédiates et ignore les non-accords', () => {
    const chords = ['C', 'C', 'G', 'N', 'Am', 'Am', 'F', 'C'].map(parseChord);
    expect(tokensOf(chords, 0).map((t) => degreeLabel(tokenToDegree(t)))).toEqual(['I', 'V', 'vi', 'IV', 'I']);
  });
  it('lit et écrit une progression sous forme « I,V,vi,IV »', () => {
    const p = parseProgression('I,V,vi,IV')!;
    expect(p).toHaveLength(4);
    expect(progressionLabel(p)).toBe('I–V–vi–IV');
    expect(parseProgression('I, V , vi,IV')).toEqual(p);
    expect(parseProgression('I-V-vi-IV')).toEqual(p);
    expect(parseProgression('I–V–vi–IV')).toEqual(p);
    expect(parseProgression('I,V,zz')).toBeNull();
    expect(parseProgression('I')).toBeNull();
  });
  it('énumère les rotations distinctes', () => {
    const p = parseProgression('I,V,vi,IV')!;
    const r = rotations(p).map(progressionLabel);
    expect(r).toEqual(['V–vi–IV–I', 'vi–IV–I–V', 'IV–I–V–vi']);
    expect(rotations(parseProgression('I,V,I,V')!).map(progressionLabel)).toEqual(['V–I–V–I']);
  });
});
