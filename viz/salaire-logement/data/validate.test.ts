import { describe, expect, it } from 'vitest';
import { PriceSource, SCHEMA_VERSION, type PricesFile } from './contract';
import { DataValidationError, validatePrices } from './validate';

function makeFile(): PricesFile {
  const series = () => ({ pxm2: [3000, null], n: [25, 3], src: [PriceSource.CommuneAnnual, PriceSource.None] as PriceSource[] });
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: 't',
    years: [2024, 2025],
    codes: ['44109'],
    uncoveredDepartements: ['57'],
    series: { maison: series(), appartement: series() },
  };
}

describe('validatePrices', () => {
  it('accepte un fichier cohérent', () => {
    expect(() => validatePrices(makeFile())).not.toThrow();
  });

  it('rejette une mauvaise version de schéma', () => {
    expect(() => validatePrices({ ...makeFile(), schemaVersion: 99 })).toThrow(DataValidationError);
  });

  it('rejette des tableaux de mauvaise longueur', () => {
    const f = makeFile();
    f.series.maison.pxm2.push(1);
    expect(() => validatePrices(f)).toThrow(/longueur/);
  });

  it('rejette un prix sans source (ou l’inverse)', () => {
    const f = makeFile();
    f.series.appartement.src[1] = PriceSource.EpciAnnual;
    expect(() => validatePrices(f)).toThrow(/incohérents/);
  });

  it('rejette un prix hors bornes', () => {
    const f = makeFile();
    f.series.maison.pxm2[0] = 5;
    expect(() => validatePrices(f)).toThrow(/hors bornes/);
  });

  it('rejette des années non contiguës', () => {
    expect(() => validatePrices({ ...makeFile(), years: [2023, 2025] })).toThrow(/continue/);
  });
});
