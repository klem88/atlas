import { describe, expect, it } from 'vitest';
import { bandEdges, fft, spectrogram, toMono } from './spectrogram';

const SPEC = { bins: 48, fMin: 250, fMax: 11_000, frameSeconds: 0.08 };
const RATE = 44_100;

function tone(freq: number, seconds: number, amp = 0.5): Float32Array {
  return Float32Array.from({ length: Math.round(seconds * RATE) }, (_, i) => amp * Math.sin((2 * Math.PI * freq * i) / RATE));
}

describe('fft', () => {
  it('trouve la raie d’une sinusoïde', () => {
    const n = 64;
    const re = Float64Array.from({ length: n }, (_, i) => Math.cos((2 * Math.PI * 5 * i) / n));
    const im = new Float64Array(n);
    fft(re, im);
    const mags = Array.from(re, (r, i) => Math.hypot(r, im[i]!));
    expect(mags[5]).toBeCloseTo(n / 2);
    expect(mags[6]).toBeCloseTo(0);
  });
});

describe('bandEdges', () => {
  it('répartit les bandes géométriquement', () => {
    const e = bandEdges(SPEC);
    expect(e).toHaveLength(49);
    expect(e[0]).toBeCloseTo(250);
    expect(e[48]).toBeCloseTo(11_000);
    expect(e[2]! / e[1]!).toBeCloseTo(e[1]! / e[0]!);
  });
});

describe('spectrogram', () => {
  it('place un sifflement de 3 kHz dans la bonne bande', () => {
    // Un sifflement bref au milieu d'un silence : le bruit de fond médian est le silence.
    const { data, frames } = spectrogram(Float32Array.from([...tone(3000, 0.4), ...new Float32Array(RATE)]), RATE, SPEC);
    expect(frames).toBe(Math.floor((1.4 * RATE - 2048) / Math.round(0.08 * RATE)) + 1);
    const edges = bandEdges(SPEC);
    const band = edges.findIndex((f, i) => f <= 3000 && edges[i + 1]! > 3000);
    const column = Array.from(data.subarray(3 * SPEC.bins, 4 * SPEC.bins));
    expect(column.indexOf(Math.max(...column))).toBe(band);
    expect(column[band]).toBe(255);
    expect(column[0]).toBeLessThan(60);
  });

  it('efface un bruit de fond continu mais garde le chant qui le dépasse', () => {
    const hum = tone(500, 2, 0.05);
    const bird = Float32Array.from(hum, (h, i) => h + (i > RATE && i < 1.3 * RATE ? 0.5 * Math.sin((2 * Math.PI * 4000 * i) / RATE) : 0));
    const { data } = spectrogram(bird, RATE, SPEC);
    const edges = bandEdges(SPEC);
    const band = (f: number) => edges.findIndex((e, i) => e <= f && edges[i + 1]! > f);
    const at = (t: number, b: number) => data[t * SPEC.bins + b]!;
    expect(at(2, band(500))).toBe(0); // le bourdonnement disparaît
    expect(at(14, band(4000))).toBeGreaterThan(200); // le chant reste
  });

  it('suit un glissando vers l’aigu', () => {
    const a = spectrogram(Float32Array.from([...tone(1000, 0.3), ...tone(6000, 0.3), ...new Float32Array(RATE)]), RATE, SPEC);
    const peak = (t: number) => {
      const col = Array.from(a.data.subarray(t * SPEC.bins, (t + 1) * SPEC.bins));
      return col.indexOf(Math.max(...col));
    };
    expect(peak(5)).toBeGreaterThan(peak(0));
  });
});

describe('toMono', () => {
  it('moyenne les canaux', () => {
    expect(Array.from(toMono([Float32Array.of(1, 0), Float32Array.of(0, 1)]))).toEqual([0.5, 0.5]);
  });
});
