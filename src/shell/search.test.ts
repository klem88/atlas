import { describe, expect, it } from 'vitest';
import { normalizeForSearch } from './html';
import { rankItems } from './search';

const items = ['Saint-Étienne', 'Étienne-sur-Mer', 'Nantes', 'Nanterre', 'Saint-Nazaire'].map((label) => ({
  label,
  key: normalizeForSearch(label),
}));

describe('rankItems', () => {
  it('ignore accents, casse et tirets', () => {
    expect(rankItems(items, 'saint etienne').map((i) => i.label)).toEqual(['Saint-Étienne']);
  });

  it('place le début de nom avant le début de mot', () => {
    expect(rankItems(items, 'etienne').map((i) => i.label)).toEqual(['Étienne-sur-Mer', 'Saint-Étienne']);
  });

  it('préfère les noms courts à score égal', () => {
    expect(rankItems(items, 'nan').map((i) => i.label)).toEqual(['Nantes', 'Nanterre']);
  });

  it('exige au moins deux caractères', () => {
    expect(rankItems(items, 'n')).toEqual([]);
  });
});
