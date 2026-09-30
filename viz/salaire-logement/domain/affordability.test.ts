import { describe, expect, it } from 'vitest';
import { DEFAULT_ASSUMPTIONS, affordableArea, debtRatioFor, maxLoan, purchaseCapacity } from './affordability';
import { AREA_CLASSES, classIndex } from './classes';

describe('maxLoan', () => {
  it('correspond au calcul d’annuité de référence (1 000 €/mois, 3 %, 25 ans, sans assurance)', () => {
    // 1000 × (1 − 1,0025^−300) / 0,0025 ≈ 210 876 €
    expect(maxLoan(1000, 3, 25, 0)).toBeCloseTo(210_876, -1);
  });

  it('gère un taux nul', () => {
    expect(maxLoan(1000, 0, 25, 0)).toBe(300_000);
  });

  it('diminue quand le taux ou l’assurance augmentent', () => {
    expect(maxLoan(1000, 4, 25, 0)).toBeLessThan(maxLoan(1000, 1, 25, 0));
    expect(maxLoan(1000, 3, 25, 0.3)).toBeLessThan(maxLoan(1000, 3, 25, 0));
  });

  it('renvoie 0 pour une mensualité ou une durée nulle', () => {
    expect(maxLoan(0, 3, 25, 0.3)).toBe(0);
    expect(maxLoan(1000, 3, 0, 0.3)).toBe(0);
  });
});

describe('debtRatioFor', () => {
  it('suit les règles du HCSF', () => {
    expect(debtRatioFor(2015)).toBe(0.33);
    expect(debtRatioFor(2020)).toBe(0.33);
    expect(debtRatioFor(2021)).toBe(0.35);
  });
});

describe('purchaseCapacity', () => {
  const base = { netMonthlyIncome: 3000, year: 2025, annualRatePct: 3, assumptions: DEFAULT_ASSUMPTIONS };

  it('enchaîne mensualité → emprunt → prix hors frais', () => {
    const c = purchaseCapacity(base);
    expect(c.monthlyPayment).toBeCloseTo(1050);
    expect(c.maxPrice).toBeCloseTo(c.loan / 1.075);
  });

  it('ajoute l’apport au budget', () => {
    const without = purchaseCapacity(base);
    const withDown = purchaseCapacity({ ...base, assumptions: { ...DEFAULT_ASSUMPTIONS, downPayment: 21_500 } });
    expect(withDown.maxPrice - without.maxPrice).toBeCloseTo(20_000);
  });

  it('ne produit jamais de valeurs négatives', () => {
    const c = purchaseCapacity({ ...base, netMonthlyIncome: -500, assumptions: { ...DEFAULT_ASSUMPTIONS, downPayment: -1 } });
    expect(c.loan).toBe(0);
    expect(c.maxPrice).toBe(0);
  });
});

describe('affordableArea et classes', () => {
  it('divise le budget par le prix au m²', () => {
    expect(affordableArea(200_000, 4000)).toBe(50);
    expect(affordableArea(200_000, 0)).toBe(0);
  });

  it('classe les surfaces aux bornes', () => {
    expect(classIndex(0)).toBe(0);
    expect(classIndex(19.9)).toBe(0);
    expect(classIndex(20)).toBe(1);
    expect(classIndex(10_000)).toBe(AREA_CLASSES.length - 1);
  });
});
