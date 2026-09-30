import { describe, expect, it } from 'vitest';
import { buildCardData } from './share-card';

const base = {
  netMonthlyIncome: 2500,
  year: 2025,
  rate: 3.02,
  budget: {
    value: 163_000,
    peak: { x: 2021, y: 199_000 },
    series: [
      { x: 2021, y: 199_000 },
      { x: 2025, y: 163_000 },
    ],
  },
  url: 'https://klem88.github.io/atlas/viz/salaire-logement/?revenu=2500',
};

const norm = (s: string | null) => s?.replace(/\s/g, ' ');

describe('buildCardData', () => {
  it('parle du budget quand aucune commune n’est choisie', () => {
    const d = buildCardData({ ...base, commune: null });
    expect(norm(d.figure)).toBe('163 000 €');
    expect(norm(d.comparison)).toBe('contre 199 000 € en 2021');
  });

  it('parle de la commune quand elle est choisie', () => {
    const d = buildCardData({
      ...base,
      commune: { nom: 'Nantes', area: 48.2, peak: { x: 2016, y: 66 }, series: [] },
    });
    expect(norm(d.figure)).toBe('48 m²');
    expect(d.figureCaption).toBe('à Nantes en 2025');
    expect(norm(d.comparison)).toBe('contre 66 m² en 2016');
  });

  it('omet la comparaison quand l’année courante est (quasi) la meilleure', () => {
    const d = buildCardData({ ...base, commune: { nom: 'Guéret', area: 100, peak: { x: 2019, y: 101 }, series: [] } });
    expect(d.comparison).toBeNull();
  });
});
