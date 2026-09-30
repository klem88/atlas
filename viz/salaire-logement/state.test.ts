import { describe, expect, it } from 'vitest';
import { DEFAULT_INCOME, readStateFromUrl, stateToSearch } from './state';

const years = { first: 2010, last: 2025 };

describe('état ⇄ URL', () => {
  it('applique les valeurs par défaut', () => {
    const s = readStateFromUrl('', years);
    expect(s).toMatchObject({ netMonthlyIncome: DEFAULT_INCOME, year: 2025, mode: 'moins-cher', selectedCode: null });
  });

  it('fait l’aller-retour sans perte', () => {
    const s = readStateFromUrl('?revenu=3200&annee=2021&bien=maison&commune=2A004&apport=40000&duree=20', years);
    expect(readStateFromUrl(stateToSearch(s), years)).toEqual(s);
  });

  it('ignore les valeurs invalides ou hors bornes', () => {
    const s = readStateFromUrl('?revenu=-5&annee=1990&bien=chateau&commune=<script>&duree=99', years);
    expect(s).toMatchObject({ netMonthlyIncome: DEFAULT_INCOME, year: 2025, mode: 'moins-cher', selectedCode: null });
    expect(s.assumptions.loanYears).toBe(25);
  });
});
