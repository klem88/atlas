import { describe, expect, it } from 'vitest';
import { fmtEurosRounded, parseFrenchNumber } from './format';

describe('parseFrenchNumber', () => {
  it('accepte espaces, espaces insécables, virgule et symbole euro', () => {
    expect(parseFrenchNumber('2 400')).toBe(2400);
    expect(parseFrenchNumber('2 400,50 €')).toBe(2400.5);
  });

  it('renvoie null pour une saisie vide ou invalide', () => {
    expect(parseFrenchNumber('')).toBeNull();
    expect(parseFrenchNumber('abc')).toBeNull();
  });
});

describe('fmtEurosRounded', () => {
  it('arrondit selon l’ordre de grandeur', () => {
    expect(fmtEurosRounded(187_432).replace(/\s/g, ' ')).toBe('187 000 €');
    expect(fmtEurosRounded(12_340).replace(/\s/g, ' ')).toBe('12 500 €');
  });
});
