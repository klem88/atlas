import { describe, expect, it } from 'vitest';
import type { ChartScales } from './line-chart';
import { scrubValue } from './scrub';

// Axe 2010 → 2025 sur un viewBox de 320 unités, marges de 10 de chaque côté.
const scales: ChartScales = {
  x: (v) => 10 + ((v - 2010) / 15) * 300,
  y: (v) => v,
  xInvert: (px) => 2010 + ((px - 10) / 300) * 15,
};

describe('scrubValue', () => {
  it('convertit la position affichée en année, même si le SVG est agrandi', () => {
    // SVG affiché à 640 px pour un viewBox de 320 : le milieu (320 px) vise le milieu de l'axe.
    expect(scrubValue(320, 640, 320, scales, 2010, 2025)).toBe(2018);
  });

  it('arrondit à l’année la plus proche', () => {
    expect(scrubValue(scales.x(2014.4), 320, 320, scales, 2010, 2025)).toBe(2014);
    expect(scrubValue(scales.x(2014.6), 320, 320, scales, 2010, 2025)).toBe(2015);
  });

  it('reste dans les bornes quand on glisse au-delà du graphique', () => {
    expect(scrubValue(-50, 320, 320, scales, 2010, 2025)).toBe(2010);
    expect(scrubValue(900, 320, 320, scales, 2010, 2025)).toBe(2025);
  });
});
