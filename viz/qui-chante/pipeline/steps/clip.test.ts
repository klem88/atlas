import { describe, expect, it } from 'vitest';
import { bestWindow, normalize, toInt16 } from './clip';

const RATE = 8000;

/** Silence, puis un chant aigu de `len` s à partir de `at` s. */
function recording(total: number, at: number, len: number): Float32Array {
  return Float32Array.from({ length: total * RATE }, (_, i) => {
    const t = i / RATE;
    return t >= at && t < at + len ? 0.5 * Math.sin(2 * Math.PI * 3000 * t) : 0.01 * Math.sin(2 * Math.PI * 50 * t);
  });
}

describe('bestWindow', () => {
  it('trouve le passage chanté', () => {
    const start = bestWindow(recording(60, 30, 10), RATE, 15) / RATE;
    expect(start).toBeGreaterThanOrEqual(25);
    expect(start).toBeLessThanOrEqual(30);
  });

  it('préfère un chant aigu à un grondement plus fort', () => {
    const s = Float32Array.from({ length: 40 * RATE }, (_, i) => {
      const t = i / RATE;
      return t < 20 ? 0.8 * Math.sin(2 * Math.PI * 60 * t) : 0.2 * Math.sin(2 * Math.PI * 3000 * t);
    });
    expect(bestWindow(s, RATE, 10) / RATE).toBeGreaterThanOrEqual(19);
  });

  it('renvoie 0 quand l’enregistrement est plus court que la fenêtre', () => {
    expect(bestWindow(recording(5, 1, 2), RATE, 15)).toBe(0);
  });
});

describe('normalize', () => {
  it('ramène la valeur efficace à la cible', () => {
    const quiet = Float32Array.from({ length: RATE }, (_, i) => 0.01 * Math.sin((2 * Math.PI * 440 * i) / RATE));
    const out = normalize(quiet, RATE, { fadeSeconds: 0 });
    const rms = Math.sqrt(out.reduce((a, s) => a + s * s, 0) / out.length);
    expect(rms).toBeCloseTo(0.1, 2);
  });

  it('ne dépasse jamais le plafond de crête', () => {
    const spiky = new Float32Array(RATE).fill(0.001);
    spiky[100] = 0.5;
    const out = normalize(spiky, RATE, { fadeSeconds: 0 });
    expect(Math.max(...out.map(Math.abs))).toBeCloseTo(0.9);
  });

  it('commence et finit en silence', () => {
    const out = normalize(new Float32Array(RATE).fill(0.3), RATE);
    expect(out[0]).toBe(0);
    expect(out.at(-1)).toBe(0);
    expect(out[RATE / 2]).toBeGreaterThan(0);
  });
});

describe('toInt16', () => {
  it('écrête et convertit', () => {
    expect(Array.from(toInt16(Float32Array.of(0, 1, -2, 0.5)))).toEqual([0, 32767, -32767, 16384]);
  });
});
