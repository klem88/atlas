import { describe, expect, it } from 'vitest';
import { BASSE_BAS, BASSE_HAUT, drumPattern, swingFraction, swungBeat, walkingBass, type ChordSpan } from './swing';

const pc = (n: number) => ((n % 12) + 12) % 12;
const M7 = [0, 3, 7, 10];
const D7 = [0, 4, 7, 10];
const MAJ7 = [0, 4, 7, 11];

// ii–V–I en do : Ré m7 (4), Sol 7 (4), Do 7M (8).
const iiVI: ChordSpan[] = [
  { root: 2, start: 0, beats: 4, tones: M7 },
  { root: 7, start: 4, beats: 4, tones: D7 },
  { root: 0, start: 8, beats: 8, tones: MAJ7 },
];
// Turnaround en deux temps par accord.
const tour: ChordSpan[] = [
  { root: 0, start: 0, beats: 2, tones: MAJ7 },
  { root: 9, start: 2, beats: 2, tones: D7 },
  { root: 2, start: 4, beats: 2, tones: M7 },
  { root: 7, start: 6, beats: 2, tones: D7 },
];

describe('walkingBass', () => {
  for (const [nom, grille, duree] of [['ii–V–I', iiVI, 16], ['turnaround', tour, 8]] as const)
    describe(nom, () => {
      const basse = walkingBass(grille, duree);

      it('joue une note par temps, dans la zone', () => {
        expect(basse.map((h) => h.beat)).toEqual([...Array(duree).keys()]);
        for (const h of basse) {
          expect(h.midi!).toBeGreaterThanOrEqual(BASSE_BAS);
          expect(h.midi!).toBeLessThanOrEqual(BASSE_HAUT);
        }
      });

      it('pose la fondamentale au premier temps de chaque accord', () => {
        for (const c of grille) expect(pc(basse[c.start]!.midi!)).toBe(c.root);
      });

      it('approche chaque accord par un demi-ton', () => {
        grille.forEach((c, i) => {
          const suivant = grille[(i + 1) % grille.length]!;
          const avant = basse[(c.start + c.beats - 1) % duree]!.midi!;
          const ecart = pc(avant - suivant.root);
          expect([1, 11]).toContain(ecart);
        });
      });

      it('ne saute jamais de plus d’une octave', () => {
        for (let i = 1; i < basse.length; i++) expect(Math.abs(basse[i]!.midi! - basse[i - 1]!.midi!)).toBeLessThanOrEqual(12);
      });
    });
});

describe('drumPattern', () => {
  it('place la ride sur les temps et les « et » de 2 et 4, le charleston sur 2 et 4', () => {
    const d = drumPattern(4);
    expect(d.filter((h) => h.kind === 'ride').map((h) => h.beat).sort((a, b) => a - b)).toEqual([0, 1, 1.5, 2, 3, 3.5]);
    expect(d.filter((h) => h.kind === 'charleston').map((h) => h.beat)).toEqual([1, 3]);
  });
});

describe('swing', () => {
  it('retarde la croche du « et »', () => {
    expect(swungBeat(1.5, 2 / 3)).toBeCloseTo(1 + 2 / 3);
    expect(swungBeat(2, 2 / 3)).toBe(2);
    expect(swungBeat(1.25, 2 / 3)).toBe(1.25);
  });

  it('se redresse aux tempos rapides', () => {
    expect(swingFraction(120)).toBeCloseTo(2 / 3);
    expect(swingFraction(210)).toBeLessThan(2 / 3);
    expect(swingFraction(300)).toBe(0.58);
  });
});
