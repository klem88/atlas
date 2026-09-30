import { describe, expect, it } from 'vitest';
import { beatEnvelope, beatWindow, chordPairs, pairBeats } from './beats';

describe('battements d’une paire', () => {
  it('quinte tempérée do4–sol4 : 3ᵉ harmonique du do contre 2ᵉ du sol, 0,89 battement par seconde', () => {
    const b = pairBeats(60, 67, 'egal');
    expect(b.harmonics).toEqual([3, 2]);
    expect(b.lowHz).toBeCloseTo(3 * 261.6256, 2);
    expect(b.highHz).toBeCloseTo(2 * 391.9954, 2);
    expect(b.beatHz).toBeCloseTo(0.886, 2);
    expect(b.cents).toBeCloseTo(-1.955, 3);
    expect(b.semitones).toBe(7);
  });
  it('tierce majeure tempérée do4–mi4 : 5ᵉ contre 4ᵉ, environ 10 battements par seconde', () => {
    const b = pairBeats(60, 64, 'egal');
    expect(b.harmonics).toEqual([5, 4]);
    expect(b.beatHz).toBeCloseTo(10.38, 1);
  });
  it('en intonation juste, aucun battement', () => {
    expect(pairBeats(60, 64, 'pur').beatHz).toBeCloseTo(0, 9);
    expect(pairBeats(60, 67, 'pythagore').beatHz).toBeCloseTo(0, 9);
  });
  it('l’ordre des notes ne compte pas', () => {
    expect(pairBeats(67, 60, 'egal')).toEqual(pairBeats(60, 67, 'egal'));
  });
  it('l’octave tempérée est pure', () => {
    expect(pairBeats(60, 72, 'egal').beatHz).toBeCloseTo(0, 9);
  });
});

describe('paires d’un accord', () => {
  it('trois notes donnent trois paires, de la plus grave à la plus aiguë', () => {
    const pairs = chordPairs([67, 60, 64], 'egal');
    expect(pairs.map((p) => [p.low, p.high])).toEqual([
      [60, 64],
      [60, 67],
      [64, 67],
    ]);
  });
  it('une note seule ne donne aucune paire', () => {
    expect(chordPairs([60], 'egal')).toEqual([]);
  });
});

describe('fenêtre et enveloppe', () => {
  it('montre environ deux battements et demi, bornée entre 0,05 et 4 secondes', () => {
    expect(beatWindow(1)).toBeCloseTo(2.5, 9);
    expect(beatWindow(10)).toBeCloseTo(0.25, 9);
    expect(beatWindow(0)).toBe(4);
    expect(beatWindow(1000)).toBe(0.05);
  });
  it('l’enveloppe de deux ondes d’amplitude 1 va de 0 à 2 au rythme du battement', () => {
    expect(beatEnvelope(1, 0)).toBeCloseTo(2, 9);
    expect(beatEnvelope(1, 0.5)).toBeCloseTo(0, 9);
    expect(beatEnvelope(1, 1)).toBeCloseTo(2, 9);
    expect(beatEnvelope(0, 123)).toBeCloseTo(2, 9);
  });
});
