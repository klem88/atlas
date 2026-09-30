import { describe, expect, it } from 'vitest';
import { BASE_HZ, OCTAVES, counter, envelope, helixPoint, pitchAt, shepardComponents } from './shepard';

describe('enveloppe', () => {
  it('nulle aux deux bouts, maximale au milieu, symétrique', () => {
    expect(envelope(0)).toBe(0);
    expect(envelope(OCTAVES)).toBe(0);
    expect(envelope(OCTAVES / 2)).toBeCloseTo(1, 12);
    expect(envelope(2)).toBeCloseTo(envelope(OCTAVES - 2), 12);
  });
});

describe('composantes', () => {
  it('neuf sinusoïdes à l’octave, do à chaque octave pour 0 cent', () => {
    const c = shepardComponents(0);
    expect(c).toHaveLength(OCTAVES);
    expect(c[0]!.hz).toBeCloseTo(BASE_HZ, 6);
    expect(c[4]!.hz).toBeCloseTo(BASE_HZ * 16, 6);
    expect(c[0]!.amp).toBe(0);
  });
  it('monter de 1 200 cents redonne exactement le même son', () => {
    const a = shepardComponents(300);
    const b = shepardComponents(1500);
    a.forEach((x, i) => {
      expect(x.hz).toBeCloseTo(b[i]!.hz, 9);
      expect(x.amp).toBeCloseTo(b[i]!.amp, 9);
    });
  });
  it('la composante la plus forte est celle du milieu de l’enveloppe', () => {
    const c = shepardComponents(600);
    const best = c.reduce((m, x) => (x.amp > m.amp ? x : m));
    expect(best.octaves).toBeCloseTo(4.5, 9);
  });
});

describe('noms et compteur', () => {
  it('nomme la classe de hauteur et l’écart', () => {
    expect(pitchAt(0)).toEqual({ name: 'do', offsetCents: 0 });
    expect(pitchAt(720)).toEqual({ name: 'sol', offsetCents: 20 });
    expect(pitchAt(1190)).toEqual({ name: 'do', offsetCents: -10 });
    expect(pitchAt(-100)).toEqual({ name: 'si', offsetCents: 0 });
  });
  it('compte les demi-tons et les tours parcourus, dans les deux sens', () => {
    expect(counter(0)).toEqual({ semitones: 0, turns: 0 });
    expect(counter(4850)).toEqual({ semitones: 48, turns: 4 });
    expect(counter(-1300)).toEqual({ semitones: -13, turns: 1 });
  });
});

describe('hélice', () => {
  it('un tour par octave, le do en haut du cercle, la hauteur monte avec les octaves', () => {
    const p0 = helixPoint(0, 1, 0.5);
    const p1 = helixPoint(1, 1, 0.5);
    expect(p0.z).toBeCloseTo(1, 9);
    expect(p0.x).toBeCloseTo(0, 9);
    expect(p1.z).toBeCloseTo(1, 9);
    expect(p1.y).toBeCloseTo(0.5, 9);
    const q = helixPoint(0.25, 1, 0.5);
    expect(q.x).toBeCloseTo(1, 9);
  });
});
