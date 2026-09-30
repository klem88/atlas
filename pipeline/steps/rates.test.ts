import { describe, expect, it } from 'vitest';
import { validateRates } from '../../src/data/validate';
import { buildRates, parseCsv } from './rates';

describe('parseCsv', () => {
  it('gère guillemets, virgules et guillemets échappés', () => {
    expect(parseCsv('a,b,c\r\n1,"x, y","il dit ""oui"""\n')).toEqual([
      ['a', 'b', 'c'],
      ['1', 'x, y', 'il dit "oui"'],
    ]);
  });

  it('ignore le BOM et les lignes vides', () => {
    expect(parseCsv('﻿a\n\n1\n')).toEqual([['a'], ['1']]);
  });
});

describe('buildRates', () => {
  const csv = [
    'KEY,TIME_PERIOD,OBS_VALUE,TITLE',
    'k,2021-02,1.3,"France, taux"',
    'k,2021-01,1.1,"France, taux"',
    'k,2022-01,2,"France, taux"',
    'k,bad,9,x',
  ].join('\n');

  it('trie la série mensuelle et ignore les lignes invalides', () => {
    const r = buildRates(csv, 't');
    expect(r.monthly.map((m) => m.period)).toEqual(['2021-01', '2021-02', '2022-01']);
  });

  it('calcule la moyenne annuelle arrondie au centième', () => {
    expect(buildRates(csv, 't').annual).toEqual({ '2021': 1.2, '2022': 2 });
  });

  it('produit un fichier valide, et la validation signale une année manquante', () => {
    const r = buildRates(csv, 't');
    expect(() => validateRates(r, [2021, 2022])).not.toThrow();
    expect(() => validateRates(r, [2023])).toThrow(/2023/);
  });

  it('échoue explicitement si les colonnes attendues sont absentes', () => {
    expect(() => buildRates('A,B\n1,2', 't')).toThrow(/TIME_PERIOD/);
  });
});
