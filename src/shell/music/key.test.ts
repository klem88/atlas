import { describe, expect, it } from 'vitest';
import { parseChord, type Chord } from './chords';
import { estimateKey, relativeMajor, weightedChords } from './key';

const chords = (s: string) => s.split(/\s+/).map((x) => parseChord(x)!);
const est = (s: string) => estimateKey(weightedChords(chords(s)))!;

describe('estimation de tonalité', () => {
  it('trouve la tonalité majeure d’une cadence simple', () => {
    const k = est('C F G C');
    expect(k.tonic).toBe(0);
    expect(k.mode).toBe('major');
  });
  it('trouve un ii–V–I de jazz', () => {
    const k = est('Dm7 G7 Cmaj7 Cmaj7');
    expect(k.tonic).toBe(0);
    expect(k.mode).toBe('major');
    expect(est('Fm7 Bb7 Ebmaj7 Ebmaj7')).toMatchObject({ tonic: 3, mode: 'major' });
  });
  it('trouve le mineur quand la dominante le trahit', () => {
    const k = est('Am Dm E7 Am');
    expect(k.tonic).toBe(9);
    expect(k.mode).toBe('minor');
    expect(relativeMajor(k)).toBe(0);
  });
  it('donne au moins la bonne armure sur une boucle relative ambiguë', () => {
    expect(relativeMajor(est('Am F C G Am F C G'))).toBe(0);
    expect(relativeMajor(est('Em C G D Em C G D'))).toBe(7);
  });
  it('est invariante par transposition', () => {
    const base = chords('G D Em C G D Em C');
    for (let k = 0; k < 12; k++) {
      const moved: Chord[] = base.map((c) => ({ ...c, root: (c.root + k) % 12 }));
      expect(estimateKey(weightedChords(moved))!.tonic).toBe((7 + k) % 12);
    }
  });
  it('tient compte de la durée', () => {
    // Un long do majeur, un bref sol : do.
    const k = estimateKey([
      { chord: parseChord('C')!, weight: 8 },
      { chord: parseChord('G')!, weight: 1 },
    ])!;
    expect(k.tonic).toBe(0);
  });
  it('refuse le vide et signale la confiance', () => {
    expect(estimateKey([])).toBeNull();
    const clear = est('C F G C F G C');
    const murky = est('C Eb Gb A');
    expect(clear.margin).toBeGreaterThan(murky.margin);
  });
});
